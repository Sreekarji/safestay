import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const studentRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address').refine(
    (e) => /\.(edu|ac\.in|ac\.uk|edu\.\w+)$/i.test(e),
    'Please use a valid university email address (e.g. name@university.edu)'
  ),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  terms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const ownerRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid work email'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number is too long'),
  propertyName: z.string().min(2, 'Property name is required'),
  propertiesManaged: z.enum(['1', '2-5', '6-10', '10+'], { required_error: 'Please select the number of properties' }),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const reportSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  category: z.enum(['fire_safety', 'water_quality', 'structural', 'electrical', 'hygiene', 'security', 'food_safety', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  location: z.string().min(3, 'Location is required'),
  accommodationId: z.string().min(1, 'Please select an accommodation'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type StudentRegisterFormData = z.infer<typeof studentRegisterSchema>;
export type OwnerRegisterFormData = z.infer<typeof ownerRegisterSchema>;
export type OTPFormData = z.infer<typeof otpSchema>;
export type ReportFormData = z.infer<typeof reportSchema>;
