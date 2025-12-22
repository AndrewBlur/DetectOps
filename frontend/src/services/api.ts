import axios from 'axios';

const api = axios.create({
  baseURL: '/', // This will be proxied by Vite
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Project APIs
export const getProjects = () => api.get('/projects/');
export const createProject = (data: { name: string, description?: string }) => api.post('/projects/', data);
export const deleteProject = (projectId: number) => api.delete(`/projects/${projectId}`);
export const getProject = (projectId: number) => api.get(`/projects/${projectId}`);

// Image APIs
export const getImages = (projectId: number, page: number, pageSize: number) => api.get(`/projects/${projectId}/images/?page=${page}&page_size=${pageSize}`);
export const getAnnotatedImages = (projectId: number, page: number, pageSize: number) => api.get(`/projects/${projectId}/images/annotated?page=${page}&page_size=${pageSize}`);
export const uploadImage = (projectId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/projects/${projectId}/images/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const uploadBatchImages = (projectId: number, files: FileList) => {
  const formData = new FormData();
  Array.from(files).forEach(file => {
    formData.append('files', file);
  });
  return api.post(`/projects/${projectId}/images/upload/batch`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
export const deleteImage = (projectId: number, imageId: number) => api.delete(`/projects/${projectId}/images/${imageId}`);
export const getImage = (projectId: number, imageId: number) => api.get(`/projects/${projectId}/images/${imageId}`);

// Annotation APIs
export const getAnnotations = (projectId: number, imageId: number) => api.get(`/projects/${projectId}/annotations/${imageId}`);
export const createAnnotation = (projectId: number, data: any) => api.post(`/projects/${projectId}/annotations`, data);
export const deleteAnnotation = (projectId: number, annotationId: number, imageId: number) => api.delete(`/projects/${projectId}/annotations/delete/${annotationId}/${imageId}`);
export const getTags = (projectId: number) => api.get(`/projects/${projectId}/annotations/tags`);


export default api;

