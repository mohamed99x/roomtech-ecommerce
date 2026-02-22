import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import StoreLayout from '@/layouts/StoreLayout';
import { generateStoreUrl } from '@/utils/store-url-helper';
import { JewelryFooter, JewelryProductCard } from '@/components/store/jewelry';
import { Heart, ShoppingCart, Star, Gem, Shield, Award, Truck, Minus, Plus, Check, Info } from 'lucide-react';
import { getImageUrl } from '@/utils/image-helper';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import AddToCartButton from '@/components/store/AddToCartButton';
import { formatCurrency } from '@/utils/currency-formatter';
import { toast } from '@/components/custom-toast';

interface ProductVariant {
  name: string;
  values: string[];
}

interface JewelryProductDetailProps {
  product: any;
  relatedProducts: any[];
  store: any;
  storeContent?: any;
  cartCount?: number;
  wishlistCount?: number;
  isLoggedIn?: boolean;
  customPages?: Array<{
    id: number;
    name: string;
    href: string;
  }>;
}

function JewelryProductDetailContent({
  product,
  relatedProducts = [],
  store = {},
  storeContent,
  cartCount = 0,
  wishlistCount = 0,
  isLoggedIn = false,
  customPages = [],
}: JewelryProductDetailProps) {
  
  function ProductInner() {
    const { props } = usePage();
    const storeSettings = props.storeSettings || {};
    const currencies = props.currencies || [];
    
    const { isInWishlist, toggleWishlist, loading: wishlistLoading } = useWishlist();
    const { addToCart, loading: cartLoading } = useCart();
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
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
    const hasDiscount = product.sale_price && product.sale_price < product.price;
    const discountPercentage = hasDiscount ? Math.round(((product.price - product.sale_price) / product.price) * 100) : 0;
    const isInStock = product.stock > 0 && product.is_active;
    
    const productImages = (() => {
      let images: string[] = [];
      if (product.images) {
        const imageUrls = product.images.split(',').map((url: string) => url.trim()).filter((url: string) => url && url !== '');
        images.push(...imageUrls);
      }
      if (product.cover_image && !images.includes(product.cover_image)) {
        images.unshift(product.cover_image);
      }
      images = images.filter(url => url && url.trim() !== '');
      if (images.length === 0) {
        images.push(`https://placehold.co/600x600/f5f5f5/d4af37?text=${encodeURIComponent(product.name)}`);
      }
      return images;
    })();
    
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
      (productVariants && productVariants.every((variant: ProductVariant) => selectedVariants[variant.name]));
    
    const handleWishlistToggle = async () => {
      await toggleWishlist(product.id);
    };

    return (
      <>
        {/* Luxury Header */}
        <div className="bg-yellow-50 relative">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d97706' fill-opacity='0.3'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="container mx-auto px-4 py-8 relative z-10">
            <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
              <Link href={generateStoreUrl('store.home', store)} className="hover:text-yellow-600">Home</Link>
              <span>/</span>
              <Link href={generateStoreUrl('store.products', store) + '?category=' + product.category?.id} className="hover:text-yellow-600">{product.category?.name}</Link>
              <span>/</span>
              <span className="text-gray-800">{product.name}</span>
            </nav>
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* Product Images */}
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-yellow-200/50 p-6">
                  <div className="aspect-square overflow-hidden rounded-2xl mb-6 relative">
                    <img
                      src={getImageUrl(productImages[selectedImage])}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://placehold.co/600x600/f5f5f5/d4af37?text=${encodeURIComponent(product.name)}`;
                      }}
                    />
                    {hasDiscount && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 text-sm font-medium rounded-full">
                        -{discountPercentage}% OFF
                      </div>
                    )}
                  </div>
                  
                  {productImages.length > 1 && (
                    <div className="grid grid-cols-4 gap-3">
                      {productImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`aspect-square rounded-xl overflow-hidden border-2 transition-colors ${
                            selectedImage === index ? 'border-yellow-500' : 'border-yellow-200 hover:border-yellow-400'
                          }`}
                        >
                          <img
                            src={getImageUrl(image)}
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-yellow-200/50 p-10">
                  <div className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-6">
                    <Gem className="w-4 h-4 mr-2" />
                    {product.category?.name}
                  </div>
                  
                  <h1 className="text-4xl font-light text-gray-800 mb-6 tracking-wide">
                    {product.name}
                  </h1>
                  
                  {/* Rating */}
                  {(product.total_reviews > 0 || product.reviews_count > 0 || (product.reviews && product.reviews.length > 0)) && (
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => {
                          const rating = averageRating || 0;
                          return (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${i < Math.floor(Number(rating)) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                            />
                          );
                        })}
                      </div>
                      <span className="text-gray-600 font-light">({Number(averageRating || 0).toFixed(1)}) • {totalReviews || 0} Reviews</span>
                    </div>
                  )}
                  
                  {/* Price */}
                  <div className="flex items-center space-x-4 mb-8">
                    {hasDiscount ? (
                      <>
                        <span className="text-3xl font-light text-gray-800">{formatCurrency(product.sale_price, storeSettings, currencies)}</span>
                        <span className="text-xl text-gray-500 line-through">{formatCurrency(product.price, storeSettings, currencies)}</span>
                      </>
                    ) : (
                      <span className="text-3xl font-light text-gray-800">{formatCurrency(product.price, storeSettings, currencies)}</span>
                    )}
                  </div>
                  
                  {/* Description */}
                  <div className="prose prose-gray max-w-none mb-8">
                    <p className="text-gray-600 font-light leading-relaxed">
                      {product.description?.replace(/<[^>]*>/g, '').substring(0, 200)}
                      {product.description && product.description.replace(/<[^>]*>/g, '').length > 200 ? '...' : ''}
                    </p>
                  </div>
                  
                  {/* Stock Status */}
                  <div className="flex items-center mb-6">
                    {isInStock ? (
                      <div className="flex items-center text-green-600">
                        <Check className="h-4 w-4 mr-2" />
                        <span className="font-light text-sm">In Stock ({product.stock} available)</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-500">
                        <Info className="h-4 w-4 mr-2" />
                        <span className="font-light text-sm">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Variants */}
                  {hasVariants && productVariants && (
                    <div className="space-y-6 mb-8">
                      {productVariants.map((variant: ProductVariant) => (
                        <div key={variant.name}>
                          <h3 className="text-sm font-medium text-gray-700 tracking-wide uppercase mb-4">{variant.name}</h3>
                          <div className="flex flex-wrap gap-3">
                            {variant.values.map((value) => (
                              <button
                                key={value}
                                onClick={() => handleVariantChange(variant.name, value)}
                                className={`px-4 py-2 border-2 rounded-xl text-sm font-medium transition-colors ${
                                  selectedVariants[variant.name] === value
                                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                    : 'border-yellow-200 hover:border-yellow-400'
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
                  
                  {/* Quantity & Actions */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <label className="text-sm font-medium text-gray-700 tracking-wide uppercase">Quantity</label>
                      <div className="flex items-center border-2 border-yellow-200 rounded-xl">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="px-4 py-2 hover:bg-yellow-50 transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-4 py-2 font-medium">{quantity}</span>
                        <button
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          className="px-4 py-2 hover:bg-yellow-50 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex space-x-4">
                      <AddToCartButton
                        product={{
                          ...product,
                          variants: hasVariants ? (allVariantsSelected ? selectedVariants : productVariants) : null
                        }}
                        storeSlug={store.slug}
                        className="flex-1 bg-yellow-600 text-white py-4 font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50"
                        isShowOption={false}
                      />
                      
                      <button
                        onClick={handleWishlistToggle}
                        disabled={wishlistLoading}
                        className={`px-6 py-4 border-2 transition-colors ${
                          isProductInWishlist 
                            ? 'border-red-500 text-red-500 hover:bg-red-50' 
                            : 'border-yellow-600 text-yellow-600 hover:bg-yellow-50'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${isProductInWishlist ? 'fill-red-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
                

              </div>
            </div>
            
            {/* Product Tabs */}
            <div className="mt-16 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-yellow-200/50 p-10">
              <div className="flex border-b border-yellow-200">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`pb-4 px-6 text-sm font-medium tracking-wide ${
                    activeTab === 'description'
                      ? 'border-b-2 border-yellow-600 text-yellow-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Description
                </button>
                {product.specifications && (
                  <button
                    onClick={() => setActiveTab('specifications')}
                    className={`pb-4 px-6 text-sm font-medium tracking-wide ${
                      activeTab === 'specifications'
                        ? 'border-b-2 border-yellow-600 text-yellow-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Specifications
                  </button>
                )}
                {hasCustomFields && (
                  <button
                    onClick={() => setActiveTab('advanced')}
                    className={`pb-4 px-6 text-sm font-medium tracking-wide ${
                      activeTab === 'advanced'
                        ? 'border-b-2 border-yellow-600 text-yellow-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Advanced
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-4 px-6 text-sm font-medium tracking-wide ${
                    activeTab === 'reviews'
                      ? 'border-b-2 border-yellow-600 text-yellow-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Reviews ({totalReviews || product.reviews_count || productReviews?.length || 0})
                </button>
              </div>

              <div className="py-8">
                {activeTab === 'description' && (
                  <div className="prose max-w-none font-light max-h-80 overflow-y-auto" dangerouslySetInnerHTML={{ __html: product.description || '' }} />
                )}

                {activeTab === 'specifications' && product.specifications && (
                  <div className="prose max-w-none font-light max-h-80 overflow-y-auto" dangerouslySetInnerHTML={{ __html: product.specifications }} />
                )}

                {activeTab === 'advanced' && hasCustomFields && (
                  <div className="space-y-6 max-h-80 overflow-y-auto">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Product Information</h3>
                      <p className="text-gray-600 mb-6">Jewelry specifications and custom attributes</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg overflow-hidden">
                      <div className="divide-y divide-yellow-100">
                        {customFields.map((field, index) => (
                          <div key={index} className="px-6 py-4 hover:bg-yellow-100 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center">
                              <dt className="text-sm font-medium text-yellow-900 sm:w-1/3 mb-1 sm:mb-0">
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
                          <span className="text-sm font-light">Based on {totalReviews || 0} reviews</span>
                        </div>

                        <button
                          onClick={() => {
                            if (!isLoggedIn) {
                              window.location.href = generateStoreUrl('store.login', store);
                              return;
                            }
                            setShowReviewModal(true);
                          }}
                          className="px-6 py-3 bg-yellow-600 text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 font-medium tracking-wide transition-colors"
                        >
                          Write a Review
                        </button>
                      </div>

                      <div className="space-y-6 max-h-80 overflow-y-auto">
                        {productReviews && productReviews.length > 0 ? (
                          productReviews.map((review: any) => (
                            <div key={review.id} className="border-b border-yellow-200 pb-6">
                              <div className="flex items-center mb-2">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-4 w-4 ${star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                    />
                                  ))}
                                </div>
                                <span className="ml-2 text-sm font-light">{review.customer_name}</span>
                                <span className="ml-auto text-sm text-gray-500 font-light">{review.created_at}</span>
                              </div>
                              <h4 className="font-medium mb-2">{review.title}</h4>
                              <p className="text-gray-600 font-light">{review.content}</p>
                              {review.store_response && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 mt-3">
                                  <div className="flex items-center mb-1">
                                    <span className="text-sm font-medium text-yellow-600">Store Response:</span>
                                  </div>
                                  <p className="text-sm text-gray-700">{review.store_response}</p>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500 font-light">No reviews yet. Be the first to review this product!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="bg-yellow-50 py-16">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-serif text-neutral-900 mb-4">
                  Related Pieces
                </h2>
                <div className="w-24 h-1 bg-yellow-600 mx-auto mb-4"></div>
                <p className="text-neutral-600 max-w-2xl mx-auto">
                  Discover more exquisite pieces from our luxury collection
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {relatedProducts.slice(0, 4).map((product) => (
                  <JewelryProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      sale_price: product.sale_price,
                      cover_image: product.cover_image,
                      slug: product.slug || '',
                      variants: product.variants,
                      stock: product.stock,
                      is_active: product.is_active,
                      category: product.category
                    }}
                    storeSettings={storeSettings}
                    currencies={currencies}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowReviewModal(false)}></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-yellow-100">
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-2xl font-light text-gray-900 mb-6 tracking-wide">Write a Review</h3>

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
                          className="w-full px-4 py-3 border-2 border-yellow-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white/80 backdrop-blur-sm"
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
                          className="w-full px-4 py-3 border-2 border-yellow-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white/80 backdrop-blur-sm"
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
                          className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-yellow-600 text-base font-light text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:w-auto transition-all duration-300 hover:shadow-xl tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 w-full inline-flex justify-center rounded-xl border-2 border-yellow-200 shadow-lg px-6 py-3 bg-white text-base font-light text-gray-700 hover:bg-yellow-50 hover:border-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:mt-0 sm:w-auto transition-all duration-300 hover:shadow-xl tracking-wide"
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
  
  return (
    <StoreLayout
      storeName={store.name}
      logo={store.logo}
      storeId={store.id}
      wishlistCount={wishlistCount}
      isLoggedIn={isLoggedIn}
      customPages={customPages.length > 0 ? customPages : undefined}
      storeContent={storeContent}
      theme={store.theme}
    >
      <ProductInner />
    </StoreLayout>
  );
}

export default function JewelryProductDetail(props: JewelryProductDetailProps) {
  return (
    <>
      <Head title={`${props.product.name} - ${props.store.name}`} />
      <JewelryProductDetailContent {...props} />
    </>
  );
}