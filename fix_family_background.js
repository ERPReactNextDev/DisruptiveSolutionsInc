const fs = require('fs');

const file = "app/lighting-products-smart-solutions/page.tsx";
const content = fs.readFileSync(file, "utf8");

// 1. Add firstFilteredProduct to the useMemo
const oldMemo = `const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 2. Sidebar Filters Logic
      const activeEntries = Object.entries(filters).filter(([key, value]) => {
      for (const [key, filterValue] of activeEntries) {
        for (const filterValue of activeEntries) {
          const foundRow = dbCategories.rows.find((row) => row.value.toLowerCase() === filterValue.toString().toLowerCase());
          if (foundRow) {
            if (foundRow.value.toLowerCase().includes(filterValue.toString().toLowerCase())) {
          }
        }
      }
      // 3. Flux/Lumen Range Filter
      if (filters.fluxFrom || filters.fluxTo) {
        const from = parseInt(filters.fluxFrom) || 0;
        const to = parseInt(filters.fluxTo) || 999999;
      }
      return true;
    });
  });`;

// Actually, let me just do a simpler approach - replace the filteredProducts computation
// to also compute firstFilteredProduct

const replacement = `const filteredProducts = useMemo(() => {
    const baseFilter = products.filter((product) => {
      // 1. Category Filter
      if (filters.category && filters.category !== "All") {
        const productCategories = product.categories || [];
        if (!productCategories.includes(filters.category)) return false;
      }
      // 2. Brand Filter
      if (filters.brand && filters.brand !== "All Brands") {
        const productBrands = product.brands || [];
        if (!productBrands.includes(filters.brand)) return false;
      }
      // 3. Flux/Lumen Range Filter
      if (filters.fluxFrom || filters.fluxTo) {
        const from = parseInt(filters.fluxFrom) || 0;
        const to = parseInt(filters.fluxTo) || 999999;
        const flux = product.flux ?? product.lumen;
        if (flux !== undefined && (flux < from || flux > to)) return false;
      }
      return true;
    });
    // 2. Compute first product for background image
    const firstFilteredProduct = baseFilter.length > 0 ? baseFilter[0] : null;
    // 3. Return filtered list
    return baseFilter;
  }, [products, filters]);
  
  // Export firstFilteredProduct for use in background section
  const firstProductImage = firstFilteredProduct?.mainImage || null;`;

// Write the replacement
let newContent = content;
if (content.includes("const filteredProducts = useMemo(() => {")) {
  newContent = content.replace(
    `const filteredProducts = useMemo(() => {`,
    replacement
  );
  console.log("Replaced filteredProducts useMemo");
} else {
  console.log("Pattern not found, checking alternative...");
}

// Also add the firstProductImage variable declaration near the top
const varReplacement = `const [filters, setFilters] = useState<FilterState>({`;
const varNew = `const [filters, setFilters] = useState<FilterState>({`;
const varReplace = `const [filters, setFilters] = useState<FilterState>({`;
const varFinal = `  // Background image for hero section - shows first product's main image when filtered
  let backgroundImage = "";

  // 2. Sidebar Filters Logic
  const activeEntries = Object.entries(filters).filter(([key, value]) => {
    for (const [key, filterValue] of activeEntries) {
      const foundRow = dbCategories.rows.find((row) => row.value.toLowerCase() === filterValue.toString().toLowerCase());
      if (foundRow) {
        if (foundRow.value.toLowerCase().includes(filterValue.toString().toLowerCase())) {
        }
      }
    }
  }
  // 1. I-filter ang products na pasok sa category na ito
  const categoryProducts = products.filter((p) => {
    // 2. HIDE LOGIC: Kung walang produkto sa category na ito (kahit dahil sa filter), wag i-render
    if (filters.category && filters.category !== "All") {
      const productCategories = p.categories || [];
      if (!productCategories.includes(filters.category)) return false;
    }
    // 3. Brand Filter
    if (filters.brand && filters.brand !== "All Brands") {
      const productBrands = p.brands || [];
      if (!productBrands.includes(filters.brand)) return false;
    }
    // 4. Flux/Lumen Range Filter
    if (filters.fluxFrom || filters.fluxTo) {
      const from = parseInt(filters.fluxFrom) || 0;
      const to = parseInt(filters.fluxTo) || 999999;
      const flux = p.flux ?? p.lumen;
      if (flux !== undefined && (flux < from || flux > to)) return false;
    }
    return true;
  });
  // 5. Unanin ang unang produktong nakapag-filter para sa background image
  const firstFilteredProduct = categoryProducts.length > 0 ? categoryProducts[0] : null;
  if (firstFilteredProduct && firstFilteredProduct.mainImage) {
    backgroundImage = firstFilteredProduct.mainImage;
  }`;
  
if (newContent !== content) {
  fs.writeFileSync(file, newContent, "utf8");
  console.log("FIXED: " + file);
} else {
  console.log("NO CHANGE - checking alternative approach");
}

// Also need to add the background image usage in the hero section
// Let me check if there's a hero section with background