import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import StoreLayout from '@/layouts/StoreLayout';
import { generateStoreUrl } from '@/utils/store-url-helper';
import { PerfumeFooter } from '@/components/store/perfume-fragrances';
import { PerfumeProductCard } from '@/components/store/perfume-fragrances';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { CartProvider } from '@/contexts/CartContext';
import { getImageUrl } from '@/utils/image-helper';
import { formatCurrency } from '@/utils/currency-formatter';
import { toast } from '@/components/custom-toast';
import { Star } from 'lucide-react';

interface PerfumeProductDetailProps {
  product: any;
  relatedProducts?: any[];
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

function PerfumeProductDetailContent({
  product,
  relatedProducts = [],
  store = {},
  storeContent = {},
  cartCount = 0,
  wishlistCount = 0,
  isLoggedIn = false,
  customPages = [],
}: PerfumeProductDetailProps) {
  const { props } = usePage();
  const storeSettings = props.storeSettings || {};
  const currencies = props.currencies || [];
  
  const { isInWishlist, toggleWishlist, loading: wishlistLoading } = useWishlist();
  const { addToCart, loading: cartLoading } = useCart();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [productReviews, setProductReviews] = useState(product.reviews || []);
  const [totalReviews, setTotalReviews] = useState(product.total_reviews || 0);
  const [averageRating, setAverageRating] = useState(product.average_rating || 0);

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
  const isOutOfStock = !product.is_active || product.stock <= 0;
  
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
  
  const productImages = (() => {
    let images = [];
    
    // Parse additional images first if they exist (comma-separated)
    if (product.images) {
      const imageUrls = product.images.split(',').map(url => url.trim()).filter(url => url && url !== '');
      images.push(...imageUrls);
    }
    
    // Add cover image if it exists and not already included
    if (product.cover_image && !images.includes(product.cover_image)) {
      images.unshift(product.cover_image);
    }
    
    // Remove any empty or invalid URLs
    images = images.filter(url => url && url.trim() !== '');
    
    // Fallback to placeholder if no images
    if (images.length === 0) {
      images.push(`https://placehold.co/600x600/fafaf9/7c3aed?text=${encodeURIComponent(product.name)}`);
    }
    
    return images;
  })();
  const hasDiscount = product.sale_price && product.sale_price < product.price;
  const discountPercentage = hasDiscount ? Math.round(((product.price - product.sale_price) / product.price) * 100) : 0;
  
  // Check if product has variants
  const hasValidVariants = (() => {
    let variants = null;
    if (product.variants) {
      if (typeof product.variants === 'string') {
        try {
          variants = JSON.parse(product.variants);
        } catch (e) {
          variants = null;
        }
      } else if (typeof product.variants === 'object') {
        variants = product.variants;
      }
    }
    return variants && typeof variants === 'object' && Object.keys(variants).length > 0;
  })();
  
  // Check if all required variants are selected
  const allVariantsSelected = !hasValidVariants || 
    (hasValidVariants && Object.keys(product.variants || {}).every(key => selectedVariants[key]));
  
  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    if (hasValidVariants && !allVariantsSelected) return;
    await addToCart(product, selectedVariants, quantity);
  };

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
        customFooter={<PerfumeFooter storeName={store.name} logo={store.logo} content={storeContent?.footer} />}
        storeId={store.id}
        theme={store.theme}
      >
        {/* Breadcrumb */}
        <section className="py-6 bg-stone-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center text-sm text-gray-600">
              <Link href={generateStoreUrl('store.home', store)} className="hover:text-purple-800">Home</Link>
              <span className="mx-2">/</span>
              <Link href={generateStoreUrl('store.products', store) + '?category=' + product.category?.id} className="hover:text-purple-800">{product.category?.name}</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">{product.name}</span>
            </div>
          </div>
        </section>

        {/* Product Detail */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16">
              
              {/* Product Images */}
              <div className="space-y-6">
                <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-stone-50 max-h-[500px]">
                  <img
                    src={getImageUrl(productImages[selectedImage]) || `https://placehold.co/600x600/fafaf9/7c3aed?text=${encodeURIComponent(product.name)}`}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {productImages && productImages.length > 1 && (
                  <div className="flex space-x-4 overflow-x-auto">
                    {productImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
                          selectedImage === index ? 'border-purple-800' : 'border-gray-200 hover:border-purple-400'
                        }`}
                      >
                        <img
                          src={getImageUrl(image) || `https://placehold.co/80x80/fafaf9/7c3aed?text=${index + 1}`}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-8">
                
                {/* Brand & Title */}
                <div>
                  {product.brand && (
                    <p className="text-purple-600 font-medium text-sm uppercase tracking-wider mb-3">{product.brand}</p>
                  )}
                  <h1 className="text-4xl font-light text-gray-900 mb-4 leading-tight">{product.name}</h1>
                  
                  {/* Rating */}
                  {(product.average_rating || product.rating || product.total_reviews || product.reviews_count) && (
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => {
                          const rating = averageRating || 0;
                          return (
                            <svg
                              key={i}
                              className={`w-5 h-5 ${i < Math.floor(Number(rating)) ? 'text-amber-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          );
                        })}
                      </div>
                      <span className="text-gray-600">({totalReviews || 0} {totalReviews === 1 ? 'review' : 'reviews'})</span>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-center space-x-4">
                  {hasDiscount ? (
                    <>
                      <span className="text-3xl font-light text-purple-800">
                        {formatCurrency(product.sale_price, storeSettings, currencies)}
                      </span>
                      <span className="text-xl text-gray-500 line-through">
                        {formatCurrency(product.price, storeSettings, currencies)}
                      </span>
                      <span className="bg-red-100 text-red-700 px-3 py-1 text-sm font-medium rounded-full">
                        -{discountPercentage}% OFF
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-light text-purple-800">
                      {formatCurrency(product.price, storeSettings, currencies)}
                    </span>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3 uppercase tracking-wider">About This Fragrance</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {product.description?.replace(/<[^>]*>/g, '').substring(0, 200)}
                      {product.description && product.description.replace(/<[^>]*>/g, '').length > 200 ? '...' : ''}
                    </p>
                  </div>
                )}

                {/* Variants */}
                {(() => {
                  let variants = null;
                  if (product.variants) {
                    if (typeof product.variants === 'string') {
                      try {
                        variants = JSON.parse(product.variants);
                      } catch (e) {
                        variants = null;
                      }
                    } else if (typeof product.variants === 'object') {
                      variants = product.variants;
                    }
                  }
                  
                  const hasValidVariants = variants && typeof variants === 'object' && Object.keys(variants).length > 0;
                  
                  return hasValidVariants ? (
                    <div className="space-y-4">
                      {Object.entries(variants).map(([key, values]) => {
                        let valueArray = [];
                        if (Array.isArray(values)) {
                          valueArray = values;
                        } else if (typeof values === 'string') {
                          valueArray = [values];
                        } else if (values && typeof values === 'object' && values.values) {
                          valueArray = Array.isArray(values.values) ? values.values : [values.values];
                        } else {
                          valueArray = [values];
                        }
                        
                        const displayKey = (values && typeof values === 'object' && values.name) ? values.name : key;
                        
                        return (
                          <div key={key}>
                            <label className="block text-sm font-medium text-gray-900 mb-2 capitalize">{displayKey}</label>
                            <div className="flex flex-wrap gap-2">
                              {valueArray.map((value, index) => (
                                <button
                                  key={`${key}-${index}`}
                                  onClick={() => setSelectedVariants(prev => ({ ...prev, [key]: value }))}
                                  className={`px-4 py-2 rounded-full border transition-colors duration-300 ${
                                    selectedVariants[key] === value
                                      ? 'border-purple-800 bg-purple-800 text-white'
                                      : 'border-gray-300 text-gray-700 hover:border-purple-400'
                                  }`}
                                >
                                  {String(value)}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null;
                })()}

                {/* Quantity & Actions */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-900">Quantity:</label>
                    <div className="flex items-center border border-gray-300 rounded-full overflow-hidden">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors duration-300"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <span className="w-12 text-center font-medium">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors duration-300"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    {product.stock && (
                      <span className="text-sm text-gray-600">({product.stock} available)</span>
                    )}
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={handleAddToCart}
                      disabled={cartLoading || isOutOfStock || (hasValidVariants && !allVariantsSelected)}
                      className={`flex-1 py-4 rounded-full font-medium transition-colors duration-300 ${
                        isOutOfStock || (hasValidVariants && !allVariantsSelected)
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-800 text-white hover:bg-purple-900'
                      } ${cartLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      {isOutOfStock ? 'Out of Stock' : 
                       hasValidVariants && !allVariantsSelected ? 'Select Options' : 
                       cartLoading ? 'Adding...' : 'Add to Cart'}
                    </button>
                    
                    <button
                      onClick={async () => await toggleWishlist(product.id)}
                      disabled={wishlistLoading}
                      className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${
                        isProductInWishlist
                          ? 'border-red-500 bg-red-50 text-red-500'
                          : 'border-gray-300 text-gray-600 hover:border-purple-400 hover:text-purple-600'
                      } ${wishlistLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <svg className="w-6 h-6" fill={isProductInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Tabs */}
        <section className="py-16 bg-stone-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
                <div className="border-b border-gray-200">
                  <nav className="flex">
                    {[
                      { id: 'description', label: 'Description' },
                      { id: 'specifications', label: 'Specifications' },
                      { id: 'details', label: 'Details' },
                      ...(hasCustomFields ? [{ id: 'advanced', label: 'Advanced' }] : []),
                      { id: 'reviews', label: `Reviews (${totalReviews || 0})` }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-300 ${
                          activeTab === tab.id
                            ? 'text-purple-800 border-b-2 border-purple-800 bg-purple-50'
                            : 'text-gray-600 hover:text-purple-600'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>
                
                <div className="p-8">
                  {activeTab === 'description' && (
                    <div className="prose prose-gray max-w-none max-h-80 overflow-y-auto">
                      {product.description ? (
                        <div dangerouslySetInnerHTML={{ __html: product.description }} />
                      ) : (
                        <p className="text-gray-600">No description available for this product.</p>
                      )}
                    </div>
                  )}
                  
                  {activeTab === 'specifications' && (
                    <div className="prose prose-gray max-w-none max-h-80 overflow-y-auto">
                      {product.specifications ? (
                        <div dangerouslySetInnerHTML={{ __html: product.specifications }} />
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {product.volume && (
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-medium text-gray-900">Volume:</span>
                                <span className="text-gray-600">{product.volume}ml</span>
                              </div>
                            )}
                            {product.brand && (
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-medium text-gray-900">Brand:</span>
                                <span className="text-gray-600">{product.brand}</span>
                              </div>
                            )}
                            {product.category && (
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="font-medium text-gray-900">Category:</span>
                                <span className="text-gray-600">{product.category.name}</span>
                              </div>
                            )}
                            <div className="flex justify-between py-2 border-b border-gray-100">
                              <span className="font-medium text-gray-900">SKU:</span>
                              <span className="text-gray-600">{product.sku || product.id}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {activeTab === 'details' && (
                    <div className="prose prose-gray max-w-none max-h-80 overflow-y-auto">
                      {product.details ? (
                        <div dangerouslySetInnerHTML={{ __html: product.details }} />
                      ) : (
                        <div className="space-y-6">
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium text-gray-900">Product Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Features</h4>
                                <ul className="text-gray-600 space-y-1">
                                  <li>• Premium quality fragrance</li>
                                  <li>• Long-lasting scent</li>
                                  <li>• Elegant packaging</li>
                                  <li>• Perfect for gifting</li>
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Usage</h4>
                                <p className="text-gray-600">Apply to pulse points such as wrists, neck, and behind ears for best results.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {activeTab === 'advanced' && hasCustomFields && (
                    <div className="space-y-6 max-h-80 overflow-y-auto">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Product Information</h3>
                        <p className="text-gray-600 mb-6">Fragrance specifications and custom attributes</p>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 rounded-2xl overflow-hidden">
                        <div className="divide-y divide-purple-100">
                          {customFields.map((field, index) => (
                            <div key={index} className="px-6 py-4 hover:bg-purple-100 transition-colors">
                              <div className="flex flex-col sm:flex-row sm:items-center">
                                <dt className="text-sm font-medium text-purple-900 sm:w-1/3 mb-1 sm:mb-0">
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
                    <div className="space-y-6">
                      {productReviews && productReviews.length > 0 ? (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Customer Reviews</h3>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => {
                                    const rating = averageRating || product.average_rating || product.rating || 0;
                                    return (
                                      <Star key={i} className={`w-5 h-5 ${i < Math.floor(Number(rating)) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                                    );
                                  })}
                                </div>
                                <span className="text-gray-600">({totalReviews || 0} reviews)</span>
                              </div>
                              <button
                                onClick={() => {
                                  if (!isLoggedIn) {
                                    window.location.href = generateStoreUrl('store.login', store);
                                    return;
                                  }
                                  setShowReviewModal(true);
                                }}
                                className="px-4 py-2 bg-purple-800 text-white rounded-full hover:bg-purple-900 font-medium transition-colors"
                              >
                                Write a Review
                              </button>
                            </div>
                          </div>
                          
                          <div className="space-y-4 max-h-80 overflow-y-auto">
                            {productReviews && productReviews.length > 0 ? (
                              productReviews.map((review, index) => (
                                <div key={review.id || index} className="border-b border-gray-100 pb-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-gray-900">{review.customer_name || review.user_name || review.name || 'Anonymous'}</span>
                                    <div className="flex items-center">
                                      {[...Array(5)].map((_, i) => (
                                        <svg
                                          key={i}
                                          className={`w-4 h-4 ${i < (review.rating || 0) ? 'text-amber-400' : 'text-gray-300'}`}
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                      ))}
                                    </div>
                                  </div>
                                  {review.title && (
                                    <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                                  )}
                                  <p className="text-gray-600 mb-2">{review.content || review.comment || review.review || 'No review content'}</p>
                                  {review.created_at && (
                                    <p className="text-sm text-gray-500">
                                      {(() => {
                                        try {
                                          const date = new Date(review.created_at);
                                          return isNaN(date.getTime()) ? review.created_at : date.toLocaleDateString();
                                        } catch {
                                          return review.created_at;
                                        }
                                      })()}
                                    </p>
                                  )}
                                  {review.store_response && (
                                    <div className="bg-purple-50 border-l-4 border-purple-800 p-4 mt-4 rounded-r-lg">
                                      <div className="font-medium text-purple-800 mb-2">Store Response:</div>
                                      <p className="text-gray-700">{review.store_response}</p>
                                    </div>
                                  )}

                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500 text-center py-4">No reviews available for this product.</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
                          <p className="text-gray-600">Be the first to review this product.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-light text-purple-800 text-center mb-12">You Might Also Love</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {relatedProducts.slice(0, 4).map((relatedProduct) => (
                  <PerfumeProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                    storeSettings={storeSettings}
                    currencies={currencies}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
        
        {/* Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowReviewModal(false)}></div>
              </div>
              <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-purple-100">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 px-6 pt-6 pb-4 sm:p-8 sm:pb-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-2xl font-bold text-slate-900 mb-6">Write a Review</h3>
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
                            toast.success('Thank you for your review!');
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
                          toast.error('Failed to submit review. Please try again.');
                        } finally {
                          setIsSubmittingReview(false);
                        }
                      }}>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Your Rating *</label>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button key={star} type="button" className="p-1 focus:outline-none" onClick={() => setReviewRating(star)}>
                                <Star className={`h-6 w-6 ${star <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-400 hover:fill-yellow-400'}`} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label htmlFor="review-title" className="block text-sm font-medium text-gray-700 mb-1">Review Title *</label>
                          <input type="text" id="review-title" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="Give your review a title" value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} required />
                        </div>
                        <div>
                          <label htmlFor="review-content" className="block text-sm font-medium text-gray-700 mb-1">Your Review *</label>
                          <textarea id="review-content" rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="Write your review here" value={reviewContent} onChange={(e) => setReviewContent(e.target.value)} required></textarea>
                        </div>
                        <div className="mt-8 sm:mt-6 sm:flex sm:flex-row-reverse gap-3">
                          <button type="submit" disabled={isSubmittingReview} className="w-full inline-flex justify-center rounded-2xl border border-transparent shadow-lg px-6 py-3 bg-purple-800 text-base font-bold text-white hover:bg-purple-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:w-auto transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                          </button>
                          <button type="button" className="mt-3 w-full inline-flex justify-center rounded-2xl border-2 border-purple-200 shadow-lg px-6 py-3 bg-white text-base font-bold text-gray-700 hover:bg-purple-50 hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:w-auto transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1" onClick={() => setShowReviewModal(false)}>
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
      </StoreLayout>
    </>
  );
}

export default function PerfumeProductDetail(props: PerfumeProductDetailProps) {
  return (
    <CartProvider storeId={props.store.id} isLoggedIn={props.isLoggedIn}>
      <WishlistProvider>
        <PerfumeProductDetailContent {...props} />
      </WishlistProvider>
    </CartProvider>
  );
}