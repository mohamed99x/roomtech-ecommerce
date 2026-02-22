import React, { useState } from 'react';
import StoreLayout from '@/layouts/StoreLayout';
import { generateStoreUrl } from '@/utils/store-url-helper';
import { Head, usePage } from '@inertiajs/react';
import WatchesFooter from '@/components/store/watches/WatchesFooter';
import WatchesRelatedProducts from '@/components/store/watches/WatchesRelatedProducts';
import WatchesImageGallery from '@/components/store/watches/WatchesImageGallery';
import { Star, Heart, Share2, ChevronRight, Minus, Plus, Check, Info } from 'lucide-react';
import { getImageUrl } from '@/utils/image-helper';
import AddToCartButton from '@/components/store/AddToCartButton';
import { formatCurrency } from '@/utils/currency-formatter';
import { toast } from '@/components/custom-toast';
import { useWishlist, WishlistProvider } from '@/contexts/WishlistContext';

interface ProductVariant {
  name: string;
  values: string[];
}

interface Product {
  id: number;
  name: string;
  sku?: string;
  description: string;
  specifications?: string;
  details?: string;
  price: number;
  sale_price?: number;
  stock: number;
  cover_image?: string;
  images?: string;
  category?: {
    id: number;
    name: string;
  };
  is_active: boolean;
  variants?: ProductVariant[];
  custom_fields?: Record<string, any>;
  reviews?: Array<{
    id: number;
    rating: number;
    title: string;
    content: string;
    customer_name: string;
    created_at: string;
    store_response?: string;
  }>;
  average_rating?: number;
  total_reviews?: number;
}

interface WatchesProductDetailProps {
  product: Product;
  store: any;
  storeContent?: any;
  relatedProducts?: Product[];
  customPages?: any[];
  cartCount?: number;
  wishlistCount?: number;
  isLoggedIn?: boolean;
}

function WatchesProductDetail({ 
  product, 
  store, 
  storeContent,
  relatedProducts = [], 
  customPages = [], 
  cartCount = 0, 
  wishlistCount = 0, 
  isLoggedIn = false 
}: WatchesProductDetailProps) {
  const { props } = usePage();
  const storeSettings = props.storeSettings || {};
  const currencies = props.currencies || [];
  
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [productReviews, setProductReviews] = useState(product.reviews || []);
  const [totalReviews, setTotalReviews] = useState(product.total_reviews || 0);
  const [averageRating, setAverageRating] = useState(product.average_rating || 0);
  const { isInWishlist, toggleWishlist, loading: wishlistLoading } = useWishlist();

  // Add scroll lock effect for modal
  React.useEffect(() => {
    if (showReviewModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showReviewModal]);
  const isProductInWishlist = isInWishlist(product.id);

  // Parse images from comma-separated string and ensure all images are included
  const productImages = (() => {
    let images: string[] = [];

    // Parse additional images first if they exist (comma-separated)
    if (product.images) {
      const imageUrls = product.images.split(',').map(url => url.trim()).filter(url => url && url !== '');
      images.push(...imageUrls);
    }

    // Add cover image if it exists and not already included
    if (product.cover_image && !images.includes(product.cover_image)) {
      images.unshift(product.cover_image); // Add cover image at the beginning
    }

    // Remove any empty or invalid URLs
    images = images.filter(url => url && url.trim() !== '');

    // Fallback to placeholder if no images
    if (images.length === 0) {
      images.push(`https://placehold.co/600x800/f8fafc/64748b?text=${encodeURIComponent(product.name)}`);
    }

    return images;
  })();

  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const discountPercentage = hasDiscount ? Math.round(((product.price - product.sale_price!) / product.price) * 100) : 0;
  const isInStock = product.stock > 0 && product.is_active;
  
  // Parse variants safely
  const productVariants = (() => {
    if (!product.variants) return [];
    if (Array.isArray(product.variants)) return product.variants;
    try {
      return JSON.parse(product.variants);
    } catch (error) {
      return [];
    }
  })();

  const hasVariants = productVariants && productVariants.length > 0;
  
  const handleVariantChange = (variantName: string, value: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantName]: value
    }));
  };
  
  // Check if all required variants are selected
  // Parse custom fields safely
  const customFields = (() => {
    if (!product.custom_fields) return [];
    if (Array.isArray(product.custom_fields)) return product.custom_fields;
    if (typeof product.custom_fields === 'object') {
      return Object.entries(product.custom_fields).map(([key, value]) => ({
        name: key,
        value: value
      }));
    }
    try {
      const parsed = JSON.parse(product.custom_fields);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'object') {
        return Object.entries(parsed).map(([key, value]) => ({
          name: key,
          value: value
        }));
      }
      return [];
    } catch (error) {
      return [];
    }
  })();

  const hasCustomFields = customFields && customFields.length > 0;
  
  const allVariantsSelected = !hasVariants ||
    (productVariants && productVariants.every(variant => selectedVariants[variant.name]));

  return (
    <>
      <Head title={`${product.name} - ${store.name}`} />
      
      <StoreLayout
        storeName={store.name}
        logo={store.logo}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        isLoggedIn={isLoggedIn}
        customPages={customPages}
        storeContent={storeContent}
        storeId={store.id}
        theme={store.theme}
      >
        <div className="bg-white min-h-screen">
          {/* Breadcrumb */}
          <div className="bg-slate-50 border-b border-slate-200">
            <div className="container mx-auto px-4 py-4">
              <nav className="text-sm font-light tracking-wide">
                <a href={`/store/${store.slug}`} className="text-slate-500 hover:text-amber-600 transition-colors">Home</a>
                <ChevronRight className="h-4 w-4 mx-2 text-slate-400 inline" />
                {product.category && (
                  <>
                    <a href={generateStoreUrl('store.products', store) + '?category=' + product.category.id} className="text-slate-500 hover:text-amber-600 transition-colors">{product.category.name}</a>
                    <ChevronRight className="h-4 w-4 mx-2 text-slate-400 inline" />
                  </>
                )}
                <span className="text-slate-900">{product.name}</span>
              </nav>
            </div>
          </div>

          {/* Product Detail Section */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Product Images */}
                <div>
                  <div className="relative">
                    <WatchesImageGallery 
                      images={productImages.map(img => getImageUrl(img))}
                      selectedImage={selectedImage}
                      onImageSelect={setSelectedImage}
                    />
                    {/* Floating Price Card */}
                    <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm border border-slate-200 p-4 shadow-lg">
                      {hasDiscount ? (
                        <div className="text-right">
                          <div className="text-2xl font-light text-slate-900">{formatCurrency(product.sale_price!, storeSettings, currencies)}</div>
                          <div className="text-sm text-slate-500 line-through">{formatCurrency(product.price, storeSettings, currencies)}</div>
                          <div className="bg-amber-500 text-slate-900 px-2 py-1 text-xs font-medium tracking-wider uppercase mt-1">
                            -{discountPercentage}% OFF
                          </div>
                        </div>
                      ) : (
                        <div className="text-2xl font-light text-slate-900">{formatCurrency(product.price, storeSettings, currencies)}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Info Sidebar */}
                <div className="space-y-6">
                  {/* Header */}
                  <div className="bg-slate-900 text-white p-6 -mx-4 lg:mx-0">
                    {product.category && (
                      <div className="text-amber-500 text-xs font-medium tracking-widest uppercase mb-2">
                        {product.category.name}
                      </div>
                    )}
                    <h1 className="text-2xl font-light tracking-tight leading-tight">{product.name}</h1>
                    
                    {/* Rating */}
                    {(product.average_rating || product.rating || product.total_reviews || product.reviews_count) && (
                      <div className="flex items-center mt-4">
                        <div className="flex mr-2">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const rating = averageRating || 0;
                            return (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${star <= Math.floor(Number(rating)) ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`}
                              />
                            );
                          })}
                        </div>
                        <span className="text-xs text-slate-300">
                          ({Number(averageRating || 0).toFixed(1)}) • {totalReviews || 0} Reviews
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <h3 className="text-sm font-medium tracking-widest uppercase mb-3 text-slate-900">About This Timepiece</h3>
                      <p className="text-slate-600 font-light leading-relaxed text-sm">
                        {product.description?.replace(/<[^>]*>/g, '').substring(0, 150)}
                        {product.description && product.description.replace(/<[^>]*>/g, '').length > 150 ? '...' : ''}
                      </p>
                    </div>

                    {/* Stock Status */}
                    <div>
                      <h3 className="text-sm font-medium tracking-widest uppercase mb-3 text-slate-900">Availability</h3>
                      {isInStock ? (
                        <div className="flex items-center text-green-600 bg-green-50 px-3 py-2 text-sm">
                          <Check className="h-4 w-4 mr-2" />
                          <span>In Stock ({product.stock} available)</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600 bg-red-50 px-3 py-2 text-sm">
                          <Info className="h-4 w-4 mr-2" />
                          <span>Out of Stock</span>
                        </div>
                      )}
                    </div>

                    {/* Variants */}
                    {hasVariants && productVariants && (
                      <div className="space-y-6">
                        {productVariants.map((variant) => (
                          <div key={variant.name}>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm font-medium tracking-widest uppercase text-slate-900">
                                {variant.name}
                              </h3>
                              {selectedVariants[variant.name] && (
                                <span className="text-xs text-amber-600">
                                  {selectedVariants[variant.name]}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {variant.values.map((value) => (
                                <button
                                  key={value}
                                  onClick={() => handleVariantChange(variant.name, value)}
                                  className={`px-3 py-2 border text-sm transition-colors ${
                                    selectedVariants[variant.name] === value
                                      ? 'border-amber-500 bg-amber-500 text-white'
                                      : 'border-slate-300 hover:border-slate-400'
                                  }`}
                                >
                                  {value}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                        
                        {/* Variant Selection Status */}
                        {!allVariantsSelected && (
                          <div className="bg-amber-50 border border-amber-200 p-3">
                            <div className="flex items-center text-amber-800">
                              <Info className="h-4 w-4 mr-2" />
                              <span className="text-sm font-medium">Please select all options to continue</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quantity */}
                    <div>
                      <h3 className="text-sm font-medium tracking-widest uppercase mb-3 text-slate-900">Quantity</h3>
                      <div className="flex items-center border border-slate-300 w-fit">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 transition-colors border-r border-slate-300"
                          disabled={quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <div className="w-12 h-10 flex items-center justify-center font-light text-center">
                          {quantity}
                        </div>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 transition-colors border-l border-slate-300"
                          disabled={product.stock !== null && quantity >= product.stock}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4">
                      <div className="flex gap-2">
                        <AddToCartButton
                          product={{
                            ...product,
                            variants: hasVariants ? (allVariantsSelected ? selectedVariants : productVariants) : null
                          }}
                          storeSlug={store.slug}
                          className="flex-1 py-3 font-medium tracking-wider uppercase text-sm bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                          isShowOption={false}
                        />
                        
                        <button 
                          onClick={async () => await toggleWishlist(product.id)}
                          disabled={wishlistLoading}
                          className={`w-12 h-12 flex items-center justify-center border transition-colors ${
                            isProductInWishlist 
                              ? 'border-red-500 bg-red-50 text-red-600' 
                              : 'border-slate-300 hover:bg-slate-50'
                          } ${wishlistLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Heart className={`h-4 w-4 ${isProductInWishlist ? 'text-red-600 fill-red-600' : 'text-slate-600'}`} />
                        </button>
                        
                        <button className="w-12 h-12 flex items-center justify-center border border-slate-300 hover:bg-slate-50 transition-colors">
                          <Share2 className="h-4 w-4 text-slate-600" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="bg-slate-50 p-4 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">SKU:</span>
                        <span className="text-slate-900 font-medium">{product.sku || `#${product.id}`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Category:</span>
                        <span className="text-slate-900 font-medium">{product.category?.name || 'Timepiece'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Stock:</span>
                        <span className="text-slate-900 font-medium">{product.stock} units</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Horizontal Product Tabs */}
              <div className="mt-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveTab('description')}
                    className={`p-4 text-left border transition-colors ${
                      activeTab === 'description'
                        ? 'border-amber-500 bg-amber-50 text-slate-900'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm font-medium tracking-wide uppercase">Description</div>
                    <div className="text-xs text-slate-500 mt-1">Product details</div>
                  </button>
                  
                  {product.specifications && (
                    <button
                      onClick={() => setActiveTab('specifications')}
                      className={`p-4 text-left border transition-colors ${
                        activeTab === 'specifications'
                          ? 'border-amber-500 bg-amber-50 text-slate-900'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-medium tracking-wide uppercase">Specifications</div>
                      <div className="text-xs text-slate-500 mt-1">Technical specs</div>
                    </button>
                  )}
                  
                  {product.details && (
                    <button
                      onClick={() => setActiveTab('details')}
                      className={`p-4 text-left border transition-colors ${
                        activeTab === 'details'
                          ? 'border-amber-500 bg-amber-50 text-slate-900'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-medium tracking-wide uppercase">Details</div>
                      <div className="text-xs text-slate-500 mt-1">Additional info</div>
                    </button>
                  )}
                  
                  {hasCustomFields && (
                    <button
                      onClick={() => setActiveTab('advanced')}
                      className={`p-4 text-left border transition-colors ${
                        activeTab === 'advanced'
                          ? 'border-amber-500 bg-amber-50 text-slate-900'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-sm font-medium tracking-wide uppercase">Advanced</div>
                      <div className="text-xs text-slate-500 mt-1">Custom attributes</div>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`p-4 text-left border transition-colors ${
                      activeTab === 'reviews'
                        ? 'border-amber-500 bg-amber-50 text-slate-900'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm font-medium tracking-wide uppercase">Reviews</div>
                    <div className="text-xs text-slate-500 mt-1">{totalReviews || product.reviews_count || productReviews?.length || 0} customer reviews</div>
                  </button>
                </div>

                <div className="mt-8 bg-slate-50 p-6">
                  {activeTab === 'description' && (
                    <div className="prose prose-slate max-w-none font-light max-h-80 overflow-y-auto" dangerouslySetInnerHTML={{ __html: product.description || '' }} />
                  )}

                  {activeTab === 'specifications' && product.specifications && (
                    <div className="prose prose-slate max-w-none font-light max-h-80 overflow-y-auto" dangerouslySetInnerHTML={{ __html: product.specifications }} />
                  )}

                  {activeTab === 'details' && product.details && (
                    <div className="prose prose-slate max-w-none font-light max-h-80 overflow-y-auto" dangerouslySetInnerHTML={{ __html: product.details }} />
                  )}

                  {activeTab === 'advanced' && hasCustomFields && (
                    <div className="space-y-6 max-h-80 overflow-y-auto">
                      <div>
                        <h3 className="text-lg font-medium text-slate-900 mb-2">Advanced Product Information</h3>
                        <p className="text-slate-600 mb-6">Watch specifications and custom attributes</p>
                      </div>
                      <div className="bg-white border border-slate-200 overflow-hidden">
                        <div className="divide-y divide-slate-100">
                          {customFields.map((field, index) => (
                            <div key={index} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                              <div className="flex flex-col sm:flex-row sm:items-center">
                                <dt className="text-sm font-medium text-slate-900 sm:w-1/3 mb-1 sm:mb-0">
                                  {field.name || field.label || `Field ${index + 1}`}
                                </dt>
                                <dd className="text-sm text-slate-700 sm:w-2/3">
                                  {typeof field.value === 'object' ? JSON.stringify(field.value) : (field.value || 'N/A')}
                                </dd>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'reviews' && (
                    <div>
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center">
                            <div className="flex mr-4">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const rating = averageRating || 0;
                                return (
                                  <Star
                                    key={star}
                                    className={`h-5 w-5 ${star <= Math.floor(Number(rating)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                  />
                                );
                              })}
                            </div>
                            <span className="text-sm font-medium">Based on {totalReviews || 0} reviews</span>
                          </div>

                          <button
                            onClick={() => {
                              if (!isLoggedIn) {
                                window.location.href = generateStoreUrl('store.login', store);
                                return;
                              }
                              setShowReviewModal(true);
                            }}
                            className="px-6 py-3 bg-slate-900 text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 font-medium tracking-wide transition-colors"
                          >
                            Write a Review
                          </button>
                        </div>

                        <div className="space-y-4 max-h-80 overflow-y-auto">
                          {productReviews && productReviews.length > 0 ? (
                            productReviews.map((review) => (
                              <div key={review.id} className="bg-white p-4 border border-slate-200">
                                <div className="flex items-center mb-2">
                                  <div className="flex mr-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-4 w-4 ${star <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-sm font-medium">{review.customer_name}</span>
                                  <span className="ml-auto text-xs text-slate-500">{review.created_at}</span>
                                </div>
                                <h4 className="font-medium mb-2 text-sm">{review.title}</h4>
                                <p className="text-slate-600 font-light text-sm">{review.content}</p>
                                {review.store_response && (
                                  <div className="bg-amber-50 border-l-4 border-amber-500 p-3 mt-3">
                                    <div className="text-xs font-medium text-slate-900 mb-1">Store Response:</div>
                                    <p className="text-xs text-slate-700">{review.store_response}</p>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-slate-500 font-light">No reviews yet. Be the first to review this timepiece!</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <WatchesRelatedProducts
              products={relatedProducts}
              title="You May Also Like"
              subtitle="Discover similar timepieces that complement your collection"
              storeSettings={storeSettings}
              currencies={currencies}
            />
          )}
        </div>
      </StoreLayout>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowReviewModal(false)}></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-slate-200">
              <div className="bg-slate-900 px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-2xl font-light text-white mb-6 tracking-wide">Write a Review</h3>

                    <form className="space-y-4" onSubmit={async (e) => {
                      e.preventDefault();
                      if (reviewRating === 0) {
                        toast.error('Please select a rating');
                        return;
                      }

                      setIsSubmittingReview(true);
                      try {
                        const response = await fetch(route('api.reviews.store'), {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                          },
                          body: JSON.stringify({
                            product_id: product.id,
                            rating: reviewRating,
                            title: reviewTitle,
                            content: reviewContent
                          })
                        });

                        const data = await response.json();
                        
                        if (data.success) {
                          toast.success('Thank you for your review!', {
                            description: 'Your review has been submitted successfully.'
                          });
                          
                          const newReview = {
                            id: Date.now(),
                            rating: reviewRating,
                            title: reviewTitle,
                            content: reviewContent,
                            customer_name: data.review?.customer_name || 'You',
                            created_at: 'Just now',
                            store_response: null
                          };
                          
                          setProductReviews(prev => {
                            const updatedReviews = [newReview, ...prev];
                            const totalRating = updatedReviews.reduce((sum, review) => sum + review.rating, 0);
                            const newAverage = totalRating / updatedReviews.length;
                            setAverageRating(newAverage);
                            return updatedReviews;
                          });
                          setTotalReviews(prev => prev + 1);
                          
                          setReviewRating(0);
                          setReviewTitle('');
                          setReviewContent('');
                          setShowReviewModal(false);
                        } else {
                          toast.error(data.message || 'Failed to submit review');
                        }
                      } catch (error) {
                        console.error('Error submitting review:', error);
                        toast.error('Failed to submit review. Please try again.');
                      } finally {
                        setIsSubmittingReview(false);
                      }
                    }}>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Rating *</label>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className="p-1 focus:outline-none"
                              onClick={() => setReviewRating(star)}
                            >
                              <Star
                                className={`h-6 w-6 ${star <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-400 hover:fill-yellow-400'}`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="review-title" className="block text-sm font-medium text-gray-700 mb-1">Review Title *</label>
                        <input
                          type="text"
                          id="review-title"
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                          placeholder="Give your review a title"
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="review-content" className="block text-sm font-medium text-gray-700 mb-1">Your Review *</label>
                        <textarea
                          id="review-content"
                          rows={4}
                          className="w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                          placeholder="Write your review here"
                          value={reviewContent}
                          onChange={(e) => setReviewContent(e.target.value)}
                          required
                        ></textarea>
                      </div>

                      <div className="mt-8 sm:mt-6 sm:flex sm:flex-row-reverse gap-3">
                        <button
                          type="submit"
                          disabled={isSubmittingReview}
                          className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-lg px-6 py-3 bg-amber-500 text-base font-medium text-slate-900 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:w-auto transition-all duration-300 hover:shadow-xl tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 w-full inline-flex justify-center rounded-lg border border-slate-300 shadow-lg px-6 py-3 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 sm:mt-0 sm:w-auto transition-all duration-300 hover:shadow-xl tracking-wide"
                          onClick={() => setShowReviewModal(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function WatchesProductDetailWrapper(props: WatchesProductDetailProps) {
  return (
    <WishlistProvider>
      <WatchesProductDetail {...props} />
    </WishlistProvider>
  );
}