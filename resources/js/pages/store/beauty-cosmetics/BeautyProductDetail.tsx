import React, { useState } from 'react';
import StoreLayout from '@/layouts/StoreLayout';
import { generateStoreUrl } from '@/utils/store-url-helper';
import { Head, usePage } from '@inertiajs/react';
import { BeautyFooter, BeautyProductCard } from '@/components/store/beauty-cosmetics';
import { Star, Heart, Share2, ChevronRight, Minus, Plus, Check, Info } from 'lucide-react';
import { getImageUrl } from '@/utils/image-helper';
import { useWishlist, WishlistProvider } from '@/contexts/WishlistContext';
import { useCart, CartProvider } from '@/contexts/CartContext';
import { formatCurrency } from '@/utils/currency-formatter';
import { toast } from '@/components/custom-toast';

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

interface BeautyProductDetailProps {
  product: Product;
  store: any;
  storeContent?: any;
  relatedProducts?: Product[];
  customPages?: any[];
  cartCount?: number;
  wishlistCount?: number;
  isLoggedIn?: boolean;
}

function BeautyProductDetailContent({ 
  product, 
  store, 
  storeContent,
  relatedProducts = [], 
  customPages = [], 
  cartCount = 0, 
  wishlistCount = 0, 
  isLoggedIn = false 
}: BeautyProductDetailProps) {
  const { props } = usePage();
  const storeSettings = props.storeSettings || {};
  const currencies = props.currencies || [];
  
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
  const { addToCart, loading: cartLoading } = useCart();
  
  const isProductInWishlist = isInWishlist(product.id);

  const productImages = (() => {
    let images: string[] = [];
    if (product.images) {
      const imageUrls = product.images.split(',').map(url => url.trim()).filter(url => url && url !== '');
      images.push(...imageUrls);
    }
    if (product.cover_image && !images.includes(product.cover_image)) {
      images.unshift(product.cover_image);
    }
    images = images.filter(url => url && url.trim() !== '');
    if (images.length === 0) {
      images.push(`https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=800&fit=crop&crop=center`);
    }
    return images;
  })();

  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const discountPercentage = hasDiscount ? Math.round(((product.price - product.sale_price!) / product.price) * 100) : 0;
  const isInStock = product.stock > 0 && product.is_active;
  
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

  const handleAddToCart = async () => {
    if (!isInStock) return;
    if (hasVariants && !allVariantsSelected) return;
    
    await addToCart(product, selectedVariants);
  };

  return (
    <>
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
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 min-h-screen">
          {/* Breadcrumb */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-rose-100">
            <div className="container mx-auto px-4 py-6">
              <nav className="text-sm font-medium">
                <a href={generateStoreUrl('store.home', store)} className="text-rose-500 hover:text-rose-600 transition-colors">Home</a>
                <ChevronRight className="h-4 w-4 mx-2 text-rose-300 inline" />
                {product.category && (
                  <>
                    <a href={generateStoreUrl('store.products', store) + '?category=' + product.category.id} className="text-rose-500 hover:text-rose-600 transition-colors">{product.category.name}</a>
                    <ChevronRight className="h-4 w-4 mx-2 text-rose-300 inline" />
                  </>
                )}
                <span className="text-gray-900">{product.name}</span>
              </nav>
            </div>
          </div>

          {/* Product Detail Section */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                {/* Product Images */}
                <div className="space-y-6">
                  <div className="aspect-square bg-white rounded-3xl overflow-hidden shadow-2xl">
                    <img
                      src={getImageUrl(productImages[selectedImage])}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=600&fit=crop&crop=center`;
                      }}
                    />
                  </div>
                  
                  {productImages.length > 1 && (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {productImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                            selectedImage === index ? 'border-rose-500 shadow-lg' : 'border-rose-200 hover:border-rose-300'
                          }`}
                        >
                          <img
                            src={getImageUrl(image)}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=80&h=80&fit=crop&crop=center`;
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                  {/* Category & Title */}
                  <div>
                    {product.category && (
                      <span className="inline-block bg-rose-100 text-rose-600 px-4 py-2 rounded-full text-sm font-medium mb-4">
                        {product.category.name}
                      </span>
                    )}
                    <h1 className="text-3xl lg:text-4xl font-light text-gray-900 mb-4 leading-tight">{product.name}</h1>
                    
                    {/* Rating */}
                    {(product.total_reviews > 0 || product.reviews_count > 0 || (product.reviews && product.reviews.length > 0)) && (
                      <div className="flex items-center mb-4">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const rating = averageRating || 0;
                            return (
                              <Star
                                key={star}
                                className={`h-5 w-5 ${star <= Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                              />
                            );
                          })}
                        </div>
                        <span className="text-gray-600 ml-3">
                          ({Number(averageRating || 0).toFixed(1)}) • {totalReviews || 0} Reviews
                        </span>
                      </div>
                    )}
                    
                    {/* Price */}
                    <div className="flex items-center gap-4 mb-6">
                      {hasDiscount ? (
                        <>
                          <span className="text-3xl font-bold text-rose-600">{formatCurrency(product.sale_price!, storeSettings, currencies)}</span>
                          <span className="text-xl text-gray-400 line-through">{formatCurrency(product.price, storeSettings, currencies)}</span>
                          <span className="bg-rose-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                            -{discountPercentage}% OFF
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl font-bold text-rose-600">{formatCurrency(product.price, storeSettings, currencies)}</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5">
                    <p className="text-gray-700 leading-relaxed text-sm">
                      {product.description?.replace(/<[^>]*>/g, '').substring(0, 250)}
                      {product.description && product.description.replace(/<[^>]*>/g, '').length > 250 ? '...' : ''}
                    </p>
                  </div>

                  {/* Stock Status */}
                  <div className="flex items-center">
                    {isInStock ? (
                      <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-full">
                        <Check className="h-5 w-5 mr-2" />
                        <span className="font-medium">In Stock ({product.stock} available)</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-500 bg-red-50 px-4 py-2 rounded-full">
                        <Info className="h-5 w-5 mr-2" />
                        <span className="font-medium">Out of Stock</span>
                      </div>
                    )}
                  </div>

                  {/* Variants */}
                  {hasVariants && productVariants && (
                    <div className="space-y-4">
                      {productVariants.map((variant) => (
                        <div key={variant.name} className="bg-white/60 backdrop-blur-sm rounded-xl p-5">
                          <h3 className="text-base font-semibold text-gray-900 mb-3">{variant.name}</h3>
                          <div className="flex flex-wrap gap-3">
                            {variant.values.map((value) => (
                              <button
                                key={value}
                                onClick={() => handleVariantChange(variant.name, value)}
                                className={`px-6 py-3 rounded-full font-medium transition-all ${
                                  selectedVariants[variant.name] === value
                                    ? 'bg-rose-600 text-white shadow-lg'
                                    : 'bg-white text-gray-700 hover:bg-rose-50 hover:text-rose-600 border border-rose-200'
                                }`}
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Quantity</h3>
                    <div className="flex items-center bg-white rounded-full border-2 border-rose-200 w-fit">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 h-12 flex items-center justify-center hover:bg-rose-50 transition-colors rounded-l-full"
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4 text-rose-600" />
                      </button>
                      <div className="w-16 h-12 flex items-center justify-center font-semibold text-gray-900">
                        {quantity}
                      </div>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-12 h-12 flex items-center justify-center hover:bg-rose-50 transition-colors rounded-r-full"
                        disabled={product.stock !== null && quantity >= product.stock}
                      >
                        <Plus className="h-4 w-4 text-rose-600" />
                      </button>
                    </div>
                  </div>

                  {/* Add to Cart & Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddToCart}
                      disabled={!isInStock || cartLoading || (hasVariants && !allVariantsSelected)}
                      className={`flex-1 py-3 px-6 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl ${
                        !isInStock || cartLoading || (hasVariants && !allVariantsSelected)
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-rose-600 text-white hover:bg-rose-700'
                      }`}
                    >
                      {cartLoading ? 'Adding...' : 'Add to Beauty Bag'}
                    </button>
                    
                    <button 
                      onClick={async () => await toggleWishlist(product.id)}
                      disabled={wishlistLoading}
                      className={`p-3 rounded-full border-2 transition-all shadow-lg hover:shadow-xl ${
                        isProductInWishlist 
                          ? 'bg-rose-600 border-rose-600 text-white' 
                          : 'bg-white border-rose-200 text-rose-600 hover:border-rose-300'
                      } ${wishlistLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <Heart className={`h-5 w-5 ${isProductInWishlist ? 'fill-current' : ''}`} />
                    </button>
                    
                    <button className="p-3 bg-white border-2 border-rose-200 rounded-full text-rose-600 hover:border-rose-300 transition-all shadow-lg hover:shadow-xl">
                      <Share2 className="h-5 w-5" />
                    </button>
                  </div>


                </div>
              </div>
            </div>
          </section>

          {/* Product Tabs */}
          <section className="py-12 bg-white/80 backdrop-blur-sm">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="flex border-b border-rose-200 mb-6">
                  <button
                    onClick={() => setActiveTab('description')}
                    className={`pb-3 px-4 font-medium transition-colors ${
                      activeTab === 'description'
                        ? 'border-b-2 border-rose-500 text-rose-600'
                        : 'text-gray-600 hover:text-rose-500'
                    }`}
                  >
                    Description
                  </button>
                  {product.specifications && (
                    <button
                      onClick={() => setActiveTab('specifications')}
                      className={`pb-3 px-4 font-medium transition-colors ${
                        activeTab === 'specifications'
                          ? 'border-b-2 border-rose-500 text-rose-600'
                          : 'text-gray-600 hover:text-rose-500'
                      }`}
                    >
                      Ingredients
                    </button>
                  )}
                  {hasCustomFields && (
                    <button
                      onClick={() => setActiveTab('advanced')}
                      className={`pb-3 px-4 font-medium transition-colors ${
                        activeTab === 'advanced'
                          ? 'border-b-2 border-rose-500 text-rose-600'
                          : 'text-gray-600 hover:text-rose-500'
                      }`}
                    >
                      Advanced
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`pb-3 px-4 font-medium transition-colors ${
                      activeTab === 'reviews'
                        ? 'border-b-2 border-rose-500 text-rose-600'
                        : 'text-gray-600 hover:text-rose-500'
                    }`}
                  >
                    Reviews ({totalReviews || product.reviews_count || productReviews?.length || 0})
                  </button>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg">
                  {activeTab === 'description' && (
                    <div className="prose max-w-none max-h-80 overflow-y-auto" dangerouslySetInnerHTML={{ __html: product.description || '' }} />
                  )}

                  {activeTab === 'specifications' && product.specifications && (
                    <div className="prose max-w-none max-h-80 overflow-y-auto" dangerouslySetInnerHTML={{ __html: product.specifications }} />
                  )}

                  {activeTab === 'advanced' && hasCustomFields && (
                    <div className="space-y-6 max-h-80 overflow-y-auto">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Product Information</h3>
                        <p className="text-gray-600 mb-6">Beauty specifications and custom attributes</p>
                      </div>
                      <div className="bg-rose-50 border border-rose-200 rounded-lg overflow-hidden">
                        <div className="divide-y divide-rose-100">
                          {customFields.map((field, index) => (
                            <div key={index} className="px-6 py-4 hover:bg-rose-100 transition-colors">
                              <div className="flex flex-col sm:flex-row sm:items-center">
                                <dt className="text-sm font-medium text-rose-900 sm:w-1/3 mb-1 sm:mb-0">
                                  {field.name || field.label || `Field ${index + 1}`}
                                </dt>
                                <dd className="text-sm text-gray-700 sm:w-2/3">
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
                            className="px-6 py-3 bg-rose-600 text-white rounded-full hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            Write a Review
                          </button>
                        </div>

                        <div className="space-y-6 max-h-80 overflow-y-auto">
                          {productReviews && productReviews.length > 0 ? (
                            productReviews.map((review) => (
                              <div key={review.id} className="border-b border-rose-100 pb-6 last:border-b-0">
                                <div className="flex items-center mb-3">
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-4 w-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                      />
                                    ))}
                                  </div>
                                  <span className="ml-3 font-medium text-gray-900">{review.customer_name}</span>
                                  <span className="ml-auto text-sm text-gray-500">{review.created_at}</span>
                                </div>
                                <h4 className="font-semibold mb-2 text-gray-900">{review.title}</h4>
                                <p className="text-gray-700">{review.content}</p>
                                {review.store_response && (
                                  <div className="bg-rose-50 border-l-4 border-rose-500 p-4 mt-4 rounded-r-lg">
                                    <div className="flex items-center mb-2">
                                      <span className="text-sm font-medium text-rose-600">Store Response:</span>
                                    </div>
                                    <p className="text-sm text-gray-700">{review.store_response}</p>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-12">
                              <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
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
            <section className="py-16">
              <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-light text-gray-900 mb-3">You Might Also Love</h2>
                  <p className="text-gray-600">Complete your beauty routine with these essentials</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {relatedProducts.slice(0, 4).map((relatedProduct) => (
                    <BeautyProductCard
                      key={relatedProduct.id}
                      product={{
                        id: relatedProduct.id,
                        name: relatedProduct.name,
                        price: relatedProduct.price,
                        sale_price: relatedProduct.sale_price,
                        cover_image: relatedProduct.cover_image,
                        slug: relatedProduct.sku || '',
                        variants: relatedProduct.variants,
                        stock: relatedProduct.stock,
                        is_active: relatedProduct.is_active,
                        category: relatedProduct.category
                      }}
                      storeSettings={storeSettings}
                      currencies={currencies}
                    />
                  ))}
                </div>
              </div>
            </section>
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

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-rose-100">
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-2xl font-light text-gray-900 mb-6">Write a Review</h3>

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
                          className="w-full px-4 py-3 border-2 border-rose-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white/80 backdrop-blur-sm"
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
                          className="w-full px-4 py-3 border-2 border-rose-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white/80 backdrop-blur-sm"
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
                          className="w-full inline-flex justify-center rounded-full border border-transparent shadow-lg px-6 py-3 bg-rose-600 text-base font-semibold text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 sm:w-auto transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 w-full inline-flex justify-center rounded-full border-2 border-rose-200 shadow-lg px-6 py-3 bg-white text-base font-semibold text-gray-700 hover:bg-rose-50 hover:border-rose-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 sm:mt-0 sm:w-auto transition-all duration-300 hover:shadow-xl"
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

export default function BeautyProductDetail(props: BeautyProductDetailProps) {
  return (
    <>
      <Head title={`${props.product.name} - ${props.store.name}`} />
      <CartProvider storeId={props.store.id} isLoggedIn={props.isLoggedIn}>
        <WishlistProvider>
          <BeautyProductDetailContent {...props} />
        </WishlistProvider>
      </CartProvider>
    </>
  );
}