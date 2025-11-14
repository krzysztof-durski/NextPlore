import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const getNearbyLocations = async (lat, lon, radius = 2) => {
  try {
    const response = await api.get('/locations/', {
      params: { lat, lon, radius }
    })
    return response.data.data
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch locations')
  }
}

export const getRecommendedLocations = async (tags, userLocation, radius = 5) => {
  try {
    const response = await api.post('/locations/recommendations', {
      tags,
      userLocation,
      radius
    })
    return response.data.data
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch recommendations')
  }
}

export const getPlaceDetails = async (id) => {
  try {
    const response = await api.get(`/locations/${id}`)
    return response.data.data
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch location details')
  }
}
