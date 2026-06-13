declare module 'framer-motion' {
  export const motion: any;
  export const AnimatePresence: any;
}

declare module 'react-hook-form' {
  export function useForm<T extends Record<string, any> = Record<string, any>>(props?: any): {
    register: any;
    handleSubmit: any;
    control: any;
    formState: { errors: any; isSubmitting: boolean };
    watch: any;
    setValue: any;
    reset: any;
    trigger: any;
    getValues: any;
  };
  export const Controller: any;
}

declare module '@hookform/resolvers/zod' {
  export function zodResolver(schema: any): any;
}

declare module 'axios' {
  const axios: any;
  export default axios;
}
