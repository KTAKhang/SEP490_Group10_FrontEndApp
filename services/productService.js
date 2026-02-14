import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hàm lấy danh sách sản phẩm với phân trang và tìm kiếm
export async function getProducts({ page = 1, limit = 10, search = null, category_name = null }) {
    try {
        // const token = await AsyncStorage.getItem('token');
        // if (!token) throw new Error('Token not found');

        let url = `https://youtube-fullstack-nodejs-forbeginer.onrender.com/api/product?page=${page}&limit=${limit}`;

        if (search && search.trim() !== '') {
            url += `&search=${encodeURIComponent(search.trim())}`;
        }

        if (category_name && category_name.trim() !== '') {
            url += `&category_name=${encodeURIComponent(category_name.trim())}`;
        }

        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                // Authorization: `Bearer ${token}`,
            },
        });

        const data = response.data;

        if (data.status !== 'OK') {
            throw new Error(data.message || 'Failed to fetch products');
        }

        // Simple approach: fetch all products and let Redux handle pagination
        // Increase limit to get more products for better active products coverage
        const fetchLimit = Math.max(limit * 3, 50); // Fetch 3x more to ensure enough active products
        const enhancedUrl = url.replace(`limit=${limit}`, `limit=${fetchLimit}`);

        const enhancedResponse = await axios.get(enhancedUrl, {
            headers: {
                'Content-Type': 'application/json',
                // Authorization: `Bearer ${token}`,
            },
        });

        const enhancedData = enhancedResponse.data;
        if (enhancedData.status !== 'OK') {
            throw new Error(enhancedData.message || 'Failed to fetch products');
        }

        // Filter active products and use API's totalActive for proper pagination
        const allProducts = enhancedData.data.products;
        const activeProducts = allProducts.filter(product => product.status === true);
        const totalActive = enhancedData.data.total.totalActive || activeProducts.length;
        const totalPages = Math.ceil(totalActive / limit);

        return {
            ...enhancedData,
            data: {
                ...enhancedData.data,
                products: activeProducts, // Return all active products fetched
                total: {
                    ...enhancedData.data.total,
                    totalProduct: totalActive,
                    currentPage: page,
                    totalPage: totalPages
                }
            }
        };

    } catch (error) {
        console.error('getProducts error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch products');
    }
}

// Hàm lấy thông tin sản phẩm theo ID
export async function getProductById(id) {
    try {
        // const token = await AsyncStorage.getItem('token');
        // if (!token) throw new Error('Token not found');



        const response = await axios.get(
            `https://youtube-fullstack-nodejs-forbeginer.onrender.com/api/product/${id}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    // Authorization: `Bearer ${token}`,
                },
            }
        );



        const data = response.data;

        if (data.status !== 'OK') {
            throw new Error(data.message || 'Failed to fetch product');
        }

        return data.data; // Trả về thông tin sản phẩm

    } catch (error) {
        console.error('getProductById API error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch product');
    }
}

// Hàm tìm kiếm sản phẩm theo tên (wrapper cho getProducts)
export async function searchProducts({ search, page = 1, limit = 10 }) {
    return getProducts({ page, limit, search });
}

// Hàm lấy sản phẩm theo category (using search instead of category_name parameter)
export async function getProductsByCategory({ category_name, page = 1, limit = 10 }) {
    try {
        // Get all products and filter client-side (most reliable approach)
        const allProductsResponse = await getProducts({ page: 1, limit: 100 });
        const allProducts = allProductsResponse.data.products;

        // Improved client-side filtering
        const normalizeString = (str) => {
            if (!str) return '';
            return str.toString()
                .toLowerCase()
                .trim()
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .normalize('NFD') // Normalize Vietnamese characters
                .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
        };

        const targetCategory = normalizeString(category_name);

        const filteredProducts = allProducts.filter(product => {
            const productCategory = normalizeString(product.category_name);
            return productCategory.includes(targetCategory) || targetCategory.includes(productCategory);
        });

        // Implement proper client-side pagination
        const totalProducts = filteredProducts.length;
        const totalPages = Math.ceil(totalProducts / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);



        // Use client-side filtered and paginated results
        const result = {
            ...allProductsResponse,
            data: {
                ...allProductsResponse.data,
                products: paginatedProducts,
                total: {
                    ...allProductsResponse.data.total,
                    totalProduct: totalProducts,
                    currentPage: page,
                    totalPage: totalPages
                }
            }
        };

        return result;

    } catch (error) {
        console.error('getProductsByCategory error:', error);
        throw error;
    }
}

// Hàm lấy danh sách sản phẩm bán chạy nhất
export async function getTopSoldProducts({ page = 1, limit = 10, search = null }) {
    try {
        // const token = await AsyncStorage.getItem('token');
        // if (!token) throw new Error('Token not found');

        let url = `https://youtube-fullstack-nodejs-forbeginer.onrender.com/api/product/top-sold?page=${page}&limit=${limit}`;

        if (search && search.trim() !== '') {
            url += `&search=${encodeURIComponent(search.trim())}`;
        }

        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                // Authorization: `Bearer ${token}`,
            },
        });

        const data = response.data;

        if (data.status !== 'OK') {
            throw new Error(data.message || 'Failed to fetch top sold products');
        }

        // Filter chỉ lấy sản phẩm có status = true (active products)
        const allProducts = data.data.products;
        const activeProducts = allProducts.filter(product => product.status === true);

        return {
            ...data,
            data: {
                ...data.data,
                products: activeProducts
            }
        };

    } catch (error) {
        console.error('getTopSoldProducts error:', error);
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch top sold products');
    }
}