export const generateStoreUrl = (routeName: string, store: any, params: any = {}) => {
  if (store?.enable_custom_domain || store?.enable_custom_subdomain) {
    return route(routeName, params);
  }
  return route(routeName, { storeSlug: store?.slug, ...params });
};