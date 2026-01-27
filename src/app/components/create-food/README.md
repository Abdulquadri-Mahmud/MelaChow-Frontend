# Create Food Page - Component Integration Guide

## 📁 File Structure

```
src/app/
├── vendors/create-food/
│   └── page.jsx (Main page - needs update)
└── components/create-food/
    ├── PortionsSection.jsx ✅
    ├── ChoiceGroupsSection.jsx ✅
    ├── ImagesSection.jsx ✅
    └── TagsSection.jsx ✅
```

## 🔧 Components Created

### 1. **PortionsSection.jsx**
- Manages portion scaling (1x, 2x, 3x portions)
- Dynamic price calculation
- Validation: Prices must increase with portion size
- Props: `portions`, `setPortions`, `basePrice`, `expanded`, `toggleExpanded`

### 2. **ChoiceGroupsSection.jsx**
- Manages customization groups (e.g., "Choose your protein")
- Min/Max selection validation
- Dynamic options with additional pricing
- Props: `choiceGroups`, `setChoiceGroups`, `expanded`, `toggleExpanded`

### 3. **ImagesSection.jsx**
- Image upload with Cloudinary
- Maximum 5 images
- Primary image indicator
- Preview and delete functionality
- Props: `images`, `setImages`, `uploading`, `onUpload`, `expanded`, `toggleExpanded`, `isValid`

### 4. **TagsSection.jsx**
- Tag management with suggested tags
- Keyboard shortcuts (Enter, Comma, Backspace)
- Visual tag chips
- Props: `tags`, `setTags`, `expanded`, `toggleExpanded`

## 📝 Integration Steps

### Step 1: Import Components in Main Page

Add these imports to `src/app/vendors/create-food/page.jsx`:

```javascript
import PortionsSection from "@/app/components/create-food/PortionsSection";
import ChoiceGroupsSection from "@/app/components/create-food/ChoiceGroupsSection";
import ImagesSection from "@/app/components/create-food/ImagesSection";
import TagsSection from "@/app/components/create-food/TagsSection";
```

### Step 2: Add Missing Sections to Form

Replace the comment `{/* Images - Continuing in next message due to length... */}` with:

```jsx
{/* Images Section */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
>
  <ImagesSection
    images={formData.images}
    setImages={(images) => setFormData((p) => ({ ...p, images }))}
    uploading={uploadingMain}
    onUpload={handleImageUpload}
    expanded={expandedSections.images}
    toggleExpanded={() => toggleSection("images")}
    isValid={validations.images}
  />
</motion.div>

{/* Variants Section - Keep existing variant code */}

{/* Portions Section */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.15 }}
>
  <PortionsSection
    portions={portions}
    setPortions={setPortions}
    basePrice={Number(formData.price) || 0}
    expanded={expandedSections.portions}
    toggleExpanded={() => toggleSection("portions")}
  />
</motion.div>

{/* Choice Groups Section */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2 }}
>
  <ChoiceGroupsSection
    choiceGroups={choiceGroups}
    setChoiceGroups={setChoiceGroups}
    expanded={expandedSections.choiceGroups}
    toggleExpanded={() => toggleSection("choiceGroups")}
  />
</motion.div>

{/* Tags Section */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.25 }}
>
  <TagsSection
    tags={formData.tags}
    setTags={(tags) => setFormData((p) => ({ ...p, tags }))}
    expanded={expandedSections.tags}
    toggleExpanded={() => toggleSection("tags")}
  />
</motion.div>

{/* Submit Buttons */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3 }}
  className="flex items-center justify-between gap-4 bg-white dark:bg-[#1E293B] rounded-3xl p-6 border border-slate-200 dark:border-slate-800"
>
  <button
    type="button"
    onClick={() => router.back()}
    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
  >
    Cancel
  </button>

  <div className="flex items-center gap-3">
    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
      <input
        type="checkbox"
        checked={formData.available}
        onChange={(e) =>
          setFormData((p) => ({ ...p, available: e.target.checked }))
        }
        className="w-4 h-4 text-[#FF6600] border-gray-300 rounded focus:ring-[#FF6600]"
      />
      Available for order
    </label>

    <button
      type="submit"
      disabled={loading}
      className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-orange-500/20"
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={20} />
          Creating...
        </>
      ) : (
        <>
          <Check size={20} />
          Create Food
        </>
      )}
    </button>
  </div>
</motion.div>
```

### Step 3: Fix TagsSection Import

Add React import to TagsSection.jsx:

```javascript
import React from "react";
```

## ✅ Features Implemented

- ✅ Hierarchical Categories (Root + Sub)
- ✅ Portions Management with price validation
- ✅ Choice Groups with min/max selection
- ✅ Image upload (max 5, Cloudinary)
- ✅ Tags with suggestions
- ✅ Variants (existing)
- ✅ Metadata (existing)
- ✅ Auto-save to localStorage
- ✅ Form validation
- ✅ Progress tracking
- ✅ Collapsible sections
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Animations with Framer Motion

## 🎨 Design Features

- Gradient section headers with icons
- Color-coded sections (purple, blue, green, pink)
- Collapsible/expandable sections
- Smooth animations
- Validation feedback
- Loading states
- Empty states with helpful messages
- Tooltips and tips

## 🔍 Validation Rules

1. **Name**: Min 3 characters
2. **Description**: Min 10 characters
3. **Categories**: Both root and sub required
4. **Price**: Must be > 0
5. **Images**: At least 1 required (max 5)
6. **Portions**: Prices must increase with portion size
7. **Choice Groups**: 
   - Group name required
   - Min select ≤ Max select
   - At least one option per group
   - All options must have names

## 📤 Payload Structure

The form submits with this structure:

```javascript
{
  name: string,
  description: string,
  images: [{ url: string, publicId: string }],
  price: number,
  deliveryFee: number,
  categories: [rootCategory, subCategory],
  variants: [{ name, price, image }],
  portions: [{ portionNumber, price, label }],
  choiceGroups: [{ name, minSelect, maxSelect, options: [{ name, price }] }],
  available: boolean,
  tags: string[],
  estimatedDeliveryTime: number,
  metadata: object
}
```

## 🚀 Next Steps

1. Add React import to TagsSection.jsx
2. Integrate components into main page
3. Test form submission
4. Verify validation
5. Test auto-save functionality

## 💡 Tips

- All sections are collapsible for better UX
- Auto-save runs every 800ms
- Draft is restored on page reload
- First image becomes primary display image
- Portions and choice groups are optional
- Tags help with search and discovery
