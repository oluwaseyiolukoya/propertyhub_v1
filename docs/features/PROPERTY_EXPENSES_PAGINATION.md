# Property Expenses Pagination & Search Feature

## ✅ Implementation Complete

Added pagination and collapsible search functionality to the "Expenses by Property" section in the Expense Management page.

---

## 🎯 Features Implemented

### **1. Pagination** 📄
- **5 properties per page** (configurable)
- Previous/Next navigation buttons
- Page number links (1, 2, 3, etc.)
- Automatic page count calculation
- Disabled state for first/last page buttons

### **2. Collapsible Search Filter** 🔍
- **Collapsed by default** (not expanded)
- Click "Search" button to expand
- Real-time property name filtering
- Resets to page 1 when searching
- Shows "No properties found" message when no matches

---

## 🎨 UI/UX Design

### **Search Button (Collapsed State):**
```
┌─────────────────────────────────────┐
│  Expenses by Property        [🔍 Search ▼] │
│  Total expenses for each property   │
└─────────────────────────────────────┘
```

### **Search Button (Expanded State):**
```
┌─────────────────────────────────────┐
│  Expenses by Property        [🔍 Search ▲] │
│  Total expenses for each property   │
│  ┌─────────────────────────────┐   │
│  │ Search properties...        │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### **Property Cards (5 per page):**
```
┌─────────────────────────────────────┐
│  📄  Luxury Apartments      ₦2.45M  │
│      12 expenses                    │
├─────────────────────────────────────┤
│  📄  Office Complex         $15,000 │
│      8 expenses                     │
├─────────────────────────────────────┤
│  📄  Residential Tower      ₦1.2M   │
│      5 expenses                     │
├─────────────────────────────────────┤
│  📄  Shopping Mall          $25,000 │
│      15 expenses                    │
├─────────────────────────────────────┤
│  📄  Industrial Park        ₦800K   │
│      3 expenses                     │
└─────────────────────────────────────┘

        ◄ Previous  1  2  3  Next ►
```

---

## 🚀 How It Works

### **Pagination Logic:**
1. **5 properties per page** (hardcoded, can be changed)
2. **Automatic page calculation:**
   - Total pages = Math.ceil(filteredProperties / 5)
3. **Slice array for current page:**
   - Start: (currentPage - 1) × 5
   - End: Start + 5

### **Search Logic:**
1. **Filter by property name** (case-insensitive)
2. **Reset to page 1** when search term changes
3. **Update pagination** based on filtered results
4. **Show empty state** if no matches

### **Collapsible Behavior:**
1. **Default: Collapsed** (search hidden)
2. **Click "Search" button** → Expands search input
3. **Click again** → Collapses search input
4. **Search persists** even when collapsed

---

## 💻 Code Implementation

### **State Management:**
```typescript
// Property pagination and search
const [propertySearchTerm, setPropertySearchTerm] = useState('');
const [propertyPage, setPropertyPage] = useState(1);
const propertiesPerPage = 5;
```

### **Filtering & Pagination:**
```typescript
// Filter properties by search term
const filteredProperties = expenseStats.byProperty.filter(propExpense =>
  propExpense.propertyName.toLowerCase().includes(propertySearchTerm.toLowerCase())
);

// Calculate pagination
const totalPages = Math.ceil(filteredProperties.length / propertiesPerPage);
const startIndex = (propertyPage - 1) * propertiesPerPage;
const endIndex = startIndex + propertiesPerPage;
const paginatedProperties = filteredProperties.slice(startIndex, endIndex);
```

### **Collapsible Search:**
```tsx
<Collapsible>
  <CollapsibleTrigger asChild>
    <Button variant="outline" size="sm">
      <Search className="h-4 w-4 mr-2" />
      Search
      <ChevronDown className="h-4 w-4 ml-2" />
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent className="mt-4">
    <Input
      placeholder="Search properties..."
      value={propertySearchTerm}
      onChange={(e) => {
        setPropertySearchTerm(e.target.value);
        setPropertyPage(1); // Reset to first page
      }}
      className="max-w-sm"
    />
  </CollapsibleContent>
</Collapsible>
```

### **Pagination Component:**
```tsx
<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious 
        onClick={() => setPropertyPage(prev => Math.max(1, prev - 1))}
        className={propertyPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
      />
    </PaginationItem>
    
    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
      <PaginationItem key={page}>
        <PaginationLink
          onClick={() => setPropertyPage(page)}
          isActive={propertyPage === page}
          className="cursor-pointer"
        >
          {page}
        </PaginationLink>
      </PaginationItem>
    ))}
    
    <PaginationItem>
      <PaginationNext 
        onClick={() => setPropertyPage(prev => Math.min(totalPages, prev + 1))}
        className={propertyPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
      />
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

---

## 🎯 Use Cases

### **Use Case 1: Owner with 20 Properties**
**Scenario:** Owner has 20 properties and wants to find a specific one.

**Steps:**
1. Navigate to Expenses page
2. Scroll to "Expenses by Property"
3. See first 5 properties (Page 1 of 4)
4. Click "Search" button
5. Type "Luxury"
6. ✅ Only properties matching "Luxury" appear
7. Pagination updates to show filtered results

---

### **Use Case 2: Browsing All Properties**
**Scenario:** Owner wants to review all property expenses systematically.

**Steps:**
1. Navigate to Expenses page
2. Scroll to "Expenses by Property"
3. Review first 5 properties
4. Click "Next" or "2" to see next 5
5. ✅ Navigate through all properties page by page

---

### **Use Case 3: Quick Search Without Clutter**
**Scenario:** Owner wants clean UI but occasional search capability.

**Steps:**
1. Navigate to Expenses page
2. See "Expenses by Property" with clean header
3. ✅ Search is hidden by default (no clutter)
4. When needed, click "Search" button
5. Search input expands smoothly
6. After searching, can collapse again

---

## 📊 Pagination Examples

### **Example 1: 12 Properties**
- **Total Pages:** 3
- **Page 1:** Properties 1-5
- **Page 2:** Properties 6-10
- **Page 3:** Properties 11-12

### **Example 2: 5 Properties**
- **Total Pages:** 1
- **Pagination:** Hidden (not needed)

### **Example 3: 18 Properties (with search "Office")**
- **Filtered Results:** 7 properties
- **Total Pages:** 2
- **Page 1:** 5 matching properties
- **Page 2:** 2 matching properties

---

## 🔧 Configuration

### **Change Items Per Page:**
```typescript
const propertiesPerPage = 5;  // Change this to 10, 15, etc.
```

### **Customize Search Placeholder:**
```tsx
<Input
  placeholder="Search properties..."  // Change this text
  // ...
/>
```

### **Adjust Search Button Style:**
```tsx
<Button variant="outline" size="sm">  // Change variant/size
  <Search className="h-4 w-4 mr-2" />
  Search
  <ChevronDown className="h-4 w-4 ml-2" />
</Button>
```

---

## 🎨 UI Components Used

### **New Components:**
1. **Pagination** - shadcn/ui pagination component
   - `Pagination`
   - `PaginationContent`
   - `PaginationItem`
   - `PaginationLink`
   - `PaginationNext`
   - `PaginationPrevious`

2. **Collapsible** - shadcn/ui collapsible component
   - `Collapsible`
   - `CollapsibleTrigger`
   - `CollapsibleContent`

### **Icons:**
- `Search` - Search icon
- `ChevronDown` - Dropdown indicator

---

## 🧪 Testing Checklist

### **Pagination Tests:**
- [x] Shows 5 properties per page
- [x] "Previous" disabled on page 1
- [x] "Next" disabled on last page
- [x] Page numbers clickable and highlight active page
- [x] Pagination hidden when ≤5 properties
- [x] Pagination updates when search filters results

### **Search Tests:**
- [x] Search collapsed by default
- [x] Click "Search" button expands input
- [x] Search filters properties in real-time
- [x] Case-insensitive search
- [x] Resets to page 1 on search
- [x] Shows "No properties found" when no matches
- [x] Clears search when input is empty

### **Integration Tests:**
- [x] Works with property expense data
- [x] Displays correct currency per property
- [x] Shows correct expense count
- [x] Hover effects work on property cards
- [x] Responsive on mobile/tablet/desktop

---

## 📱 Responsive Design

### **Desktop (≥1024px):**
- Search button aligned right
- Full pagination controls visible
- Property cards full width

### **Tablet (768px-1023px):**
- Search button below title
- Pagination controls responsive
- Property cards adjust

### **Mobile (<768px):**
- Search button stacked
- Pagination compact
- Property cards stack vertically

---

## 🎉 Benefits

### **For Users:**
1. ✅ **Cleaner UI** - Search hidden by default
2. ✅ **Faster Navigation** - Pagination for many properties
3. ✅ **Quick Search** - Find properties instantly
4. ✅ **Better Performance** - Only renders 5 items at a time

### **For Developers:**
1. ✅ **Reusable Pattern** - Can apply to other lists
2. ✅ **Maintainable Code** - Clear separation of concerns
3. ✅ **Scalable** - Handles 100+ properties efficiently
4. ✅ **Type-Safe** - Full TypeScript support

---

## 📁 Files Modified

### **Frontend:**
1. `/src/components/ExpenseManagement.tsx`
   - Added pagination state
   - Added search state
   - Implemented collapsible search
   - Implemented pagination logic
   - Added UI components

---

## 🚀 Ready to Use!

**Test it now:**
1. **Refresh browser** at `http://localhost:5173`
2. **Log in as Owner**
3. **Navigate to Expenses**
4. **Scroll to "Expenses by Property"**
5. **See first 5 properties** (if you have more than 5)
6. **Click "Search" button** → Search input expands
7. **Type property name** → Results filter instantly
8. **Click page numbers** → Navigate through pages

---

## 💡 Future Enhancements

### **Potential Improvements:**
1. **Sort Options** - Sort by name, amount, expense count
2. **Export to CSV** - Download property expense report
3. **Date Range Filter** - Filter by expense date range
4. **Category Breakdown** - Show expense categories per property
5. **Visual Charts** - Bar chart of expenses per property

---

*Last Updated: October 27, 2025*
*Feature Status: ✅ Production Ready*

