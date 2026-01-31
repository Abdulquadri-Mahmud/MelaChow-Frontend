# Auth Pages Mobile App Transformation

## Objective
Transform all authentication pages to have a native mobile app feel with:
- Fixed 100vh height (no page scrolling)
- Larger touch targets (min 44px height for buttons/inputs)
- Clean, centered layouts
- Simplified typography
- No decorative blobs or logos
- Consistent styling across all auth pages

## Pages to Update

### ✅ Completed
1. **SignUp.jsx** - User registration
2. **Signin.jsx** - User login

### 🔄 In Progress
3. **VerifyAccount.jsx** - User OTP verification
4. **ForgotPassword.jsx** - Password recovery request
5. **ResetPassword.jsx** - Password reset with OTP
6. **VendorLogin** (`/vendors/auth/login/page.jsx`)
7. **VendorRegister** (`/vendors/auth/register/page.jsx`)
8. **VendorVerify** (`/vendors/auth/verify-account/page.jsx`)

## Design Specifications

### Container
- `h-screen w-full` - Full viewport height
- `bg-white dark:bg-zinc-900` - Clean background
- `flex items-center justify-center` - Centered content
- `overflow-hidden` - No scrolling
- `p-4` - Edge padding

### Content Wrapper
- `max-w-md` - Constrained width
- `max-h-[90vh]` - Prevent overflow on small screens
- `flex flex-col justify-center` - Vertical centering

### Typography
- Headings: `text-4xl font-black italic uppercase`
- Subtext: `text-xs font-semibold`
- Labels: `text-xs font-bold`
- No excessive tracking or uppercase

### Inputs
- `p-4` - Large touch target (16px padding)
- `rounded-xl` - Modern rounded corners
- `text-base` - Readable text size
- `bg-zinc-50 dark:bg-zinc-800` - Subtle background
- `focus:ring-2 focus:ring-orange-500` - Clear focus state
- No icons inside inputs (cleaner look)

### Buttons
- `py-5` - Large touch target (20px vertical padding)
- `rounded-xl` - Consistent with inputs
- `font-bold text-base` - Clear, readable
- `bg-orange-600 hover:bg-orange-700` - Primary action color
- No shadows or excessive effects

### Spacing
- Form fields: `space-y-5` or `space-y-6`
- Sections: `mb-8` or `mb-10`
- Footer links: `mt-6`

## Implementation Notes
- Remove all LogoImage components
- Remove decorative background blobs
- Remove borders from containers
- Simplify footer links (no vendor network links on user pages)
- Use `mt-auto` on submit buttons to push to bottom when using flex-col
