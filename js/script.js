// ===== Constants =====
const STORAGE_KEYS = {
  TRANSACTIONS: 'evb_transactions',
  CATEGORIES: 'evb_categories',
  BUDGET: 'evb_budget',
  THEME: 'evb_theme'
};

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];
const CHART_COLORS = ['#E91E8C', '#008080', '#F5F0E8']; // pink, teal, cream
const MAX_CATEGORIES = 50;
const MAX_AMOUNT = 999999999.99;
const MAX_NAME_LENGTH = 100;
const MAX_CATEGORY_NAME = 50;

// ===== Application State =====
const AppState = {
  transactions: [],
  categories: [...DEFAULT_CATEGORIES],
  budgetLimit: 0,
  theme: 'light',
  sortOrder: 'default'
};

// ===== Number Formatting Utilities =====
function formatNumberWithThousandsSeparator(value) {
  // Remove all non-digit characters except decimal point
  const cleanValue = value.toString().replace(/[^\d.]/g, '');
  
  // Split into integer and decimal parts
  const parts = cleanValue.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Add thousand separators (dots)
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Combine with decimal part if exists
  return decimalPart !== undefined ? `${formattedInteger},${decimalPart}` : formattedInteger;
}

function parseFormattedNumber(value) {
  // Remove thousand separators (dots) and replace decimal comma with dot
  const cleanValue = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanValue);
}

function handleNumberInput(event) {
  const input = event.target;
  const cursorPosition = input.selectionStart;
  const oldValue = input.value;
  const oldLength = oldValue.length;
  
  // Get raw value without formatting
  const rawValue = input.value.replace(/[^\d,]/g, '');
  
  // Format the value
  if (rawValue) {
    const formatted = formatNumberWithThousandsSeparator(rawValue);
    input.value = formatted;
    
    // Adjust cursor position after formatting
    const newLength = formatted.length;
    const diff = newLength - oldLength;
    input.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
  }
}

// ===== Storage Service =====
const StorageService = {
  loadAll() {
    try {
      // Load transactions
      const txData = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (txData) {
        const parsed = JSON.parse(txData);
        if (Array.isArray(parsed)) {
          AppState.transactions = parsed;
        }
      }

      // Load categories
      const catData = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (catData) {
        const parsed = JSON.parse(catData);
        if (Array.isArray(parsed)) {
          AppState.categories = parsed;
        }
      }

      // Load budget
      const budgetData = localStorage.getItem(STORAGE_KEYS.BUDGET);
      if (budgetData) {
        const parsed = parseFloat(budgetData);
        if (!isNaN(parsed)) {
          AppState.budgetLimit = parsed;
        }
      }

      // Load theme
      const themeData = localStorage.getItem(STORAGE_KEYS.THEME);
      if (themeData === 'light' || themeData === 'dark') {
        AppState.theme = themeData;
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  },

  saveTransactions() {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(AppState.transactions));
      return true;
    } catch (error) {
      console.error('Error saving transactions:', error);
      showStorageError('Gagal menyimpan transaksi: storage penuh atau tidak tersedia.');
      return false;
    }
  },

  saveCategories() {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(AppState.categories));
      return true;
    } catch (error) {
      console.error('Error saving categories:', error);
      showStorageError('Gagal menyimpan kategori.');
      return false;
    }
  },

  saveBudget() {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGET, AppState.budgetLimit.toString());
      return true;
    } catch (error) {
      console.error('Error saving budget:', error);
      return false;
    }
  },

  saveTheme() {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, AppState.theme);
      return true;
    } catch (error) {
      console.error('Error saving theme:', error);
      return false;
    }
  }
};

// ===== Validator =====
const Validator = {
  validateName(value) {
    if (!value || value.trim().length === 0) {
      return { valid: false, message: 'Nama transaksi tidak boleh kosong.' };
    }
    if (value.length > MAX_NAME_LENGTH) {
      return { valid: false, message: `Nama maksimal ${MAX_NAME_LENGTH} karakter.` };
    }
    return { valid: true, message: '' };
  },

  validateAmount(value) {
    const num = parseFormattedNumber(value);
    if (isNaN(num)) {
      return { valid: false, message: 'Jumlah harus berupa angka.' };
    }
    if (num <= 0) {
      return { valid: false, message: 'Jumlah harus lebih besar dari 0.' };
    }
    if (num > MAX_AMOUNT) {
      return { valid: false, message: `Jumlah maksimal Rp ${formatNumberWithThousandsSeparator(MAX_AMOUNT)}.` };
    }
    return { valid: true, message: '' };
  },

  validateCategoryName(value, existingCategories) {
    if (!value || value.trim().length === 0) {
      return { valid: false, message: 'Nama kategori tidak boleh kosong.' };
    }
    if (value.length > MAX_CATEGORY_NAME) {
      return { valid: false, message: `Nama kategori maksimal ${MAX_CATEGORY_NAME} karakter.` };
    }
    
    // Check for duplicates (case-insensitive)
    const lowerValue = value.toLowerCase();
    if (existingCategories.some(cat => cat.toLowerCase() === lowerValue)) {
      return { valid: false, message: 'Kategori ini sudah ada.' };
    }

    // Check custom category limit
    const customCount = existingCategories.length - DEFAULT_CATEGORIES.length;
    if (customCount >= MAX_CATEGORIES) {
      return { valid: false, message: `Batas maksimum ${MAX_CATEGORIES} kategori kustom telah tercapai.` };
    }

    return { valid: true, message: '' };
  },

  validateBudget(value) {
    if (value === '' || value === null) {
      return { valid: true, message: '' };
    }
    const num = parseFormattedNumber(value);
    if (isNaN(num)) {
      return { valid: false, message: 'Budget harus berupa angka.' };
    }
    if (num < 0) {
      return { valid: false, message: 'Budget harus berupa angka positif.' };
    }
    if (num > MAX_AMOUNT) {
      return { valid: false, message: 'Budget terlalu besar.' };
    }
    return { valid: true, message: '' };
  }
};

// ===== Controller Functions =====
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function addTransaction(name, amount, category) {
  const balanceBeforeAdd = computeBalance(AppState.transactions);
  
  const transaction = {
    id: generateId(),
    name: name.trim(),
    amount: parseFloat(amount),
    category: category,
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now()
  };

  AppState.transactions.push(transaction);
  StorageService.saveTransactions();
  render();
  
  // Check if budget exceeded after adding transaction
  const balanceAfterAdd = computeBalance(AppState.transactions);
  const wasNotExceeded = !isBudgetExceeded(balanceBeforeAdd, AppState.budgetLimit);
  const isNowExceeded = isBudgetExceeded(balanceAfterAdd, AppState.budgetLimit);
  
  if (wasNotExceeded && isNowExceeded) {
    alert('Peringatan: Pengeluaran Anda telah melebihi batas anggaran!');
  }
}

function deleteTransaction(id) {
  AppState.transactions = AppState.transactions.filter(tx => tx.id !== id);
  StorageService.saveTransactions();
  render();
}

function addCustomCategory(name) {
  const trimmed = name.trim();
  const validation = Validator.validateCategoryName(trimmed, AppState.categories);
  
  if (!validation.valid) {
    showError('error-custom-category', validation.message);
    return false;
  }

  AppState.categories.push(trimmed);
  StorageService.saveCategories();
  render();
  
  // Clear input
  document.getElementById('custom-category-input').value = '';
  clearError('error-custom-category');
  return true;
}

function setBudgetLimit(value) {
  if (value === '' || value === null) {
    AppState.budgetLimit = 0;
  } else {
    const num = parseFormattedNumber(value);
    if (!isNaN(num) && num >= 0) {
      AppState.budgetLimit = num;
    }
  }
  StorageService.saveBudget();
  render();
}

function setSortOrder(order) {
  AppState.sortOrder = order;
  render();
}

function toggleTheme() {
  AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
  StorageService.saveTheme();
  renderTheme();
}

// ===== Computed Values =====
function computeBalance(transactions) {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0);
}

function computeMonthlySummary(transactions) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return transactions
    .filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    })
    .reduce((sum, tx) => sum + tx.amount, 0);
}

function computeCurrentMonth() {
  const now = new Date();
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
}

function computePieData(transactions) {
  if (transactions.length === 0) {
    return { labels: [], data: [], colors: [] };
  }

  // Group by category
  const categoryMap = {};
  transactions.forEach(tx => {
    if (!categoryMap[tx.category]) {
      categoryMap[tx.category] = 0;
    }
    categoryMap[tx.category] += tx.amount;
  });

  const total = computeBalance(transactions);
  const labels = [];
  const data = [];
  const colors = [];

  Object.keys(categoryMap).forEach((category, index) => {
    labels.push(category);
    const percentage = (categoryMap[category] / total) * 100;
    data.push(parseFloat(percentage.toFixed(1)));
    colors.push(CHART_COLORS[index % CHART_COLORS.length]);
  });

  return { labels, data, colors };
}

function getSortedTransactions(transactions, order) {
  const sorted = [...transactions];

  switch (order) {
    case 'price-desc':
      return sorted.sort((a, b) => {
        if (b.amount !== a.amount) return b.amount - a.amount;
        return b.timestamp - a.timestamp;
      });
    
    case 'price-asc':
      return sorted.sort((a, b) => {
        if (a.amount !== b.amount) return a.amount - b.amount;
        return b.timestamp - a.timestamp;
      });
    
    case 'category-asc':
      return sorted.sort((a, b) => {
        const catCompare = a.category.toLowerCase().localeCompare(b.category.toLowerCase());
        if (catCompare !== 0) return catCompare;
        return b.timestamp - a.timestamp;
      });
    
    case 'default':
    default:
      return sorted.sort((a, b) => {
        const dateCompare = new Date(b.date) - new Date(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.timestamp - a.timestamp;
      });
  }
}

function isBudgetExceeded(balance, budgetLimit) {
  return balance > budgetLimit && budgetLimit > 0;
}

// ===== Chart Manager =====
const ChartManager = {
  instance: null,
  canvas: null,

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error('Canvas not found');
      return;
    }

    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
      this.showFallback('Grafik tidak tersedia. Periksa koneksi internet Anda.');
      return;
    }
  },

  update(pieData) {
    if (!this.canvas || typeof Chart === 'undefined') {
      return;
    }

    // Destroy existing chart
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }

    if (pieData.labels.length === 0) {
      this.showEmpty();
      return;
    }

    // Create new chart
    const ctx = this.canvas.getContext('2d');
    this.instance = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: pieData.labels,
        datasets: [{
          data: pieData.data,
          backgroundColor: pieData.colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed || 0;
                return `${label}: ${value}%`;
              }
            }
          }
        }
      }
    });
  },

  showEmpty() {
    const container = document.getElementById('chart-container');
    if (container) {
      container.innerHTML = '<p class="empty-message">Belum ada data pengeluaran untuk ditampilkan.</p>';
    }
  },

  showFallback(message) {
    const container = document.getElementById('chart-container');
    if (container) {
      container.innerHTML = `<p class="chart-fallback">${message}</p>`;
    }
  }
};

// ===== Renderer Functions =====
function renderBalance() {
  const balance = computeBalance(AppState.transactions);
  const balanceDisplay = document.getElementById('balance-display');
  
  if (balanceDisplay) {
    balanceDisplay.textContent = `Rp ${balance.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    
    // Apply color based on budget
    if (isBudgetExceeded(balance, AppState.budgetLimit)) {
      balanceDisplay.classList.add('exceeded');
    } else {
      balanceDisplay.classList.remove('exceeded');
    }
  }
}

function renderMonthlySummary() {
  const monthlySummary = computeMonthlySummary(AppState.transactions);
  const currentMonth = computeCurrentMonth();
  
  const monthSpan = document.getElementById('current-month');
  if (monthSpan) {
    monthSpan.textContent = currentMonth;
  }

  const monthlyValue = document.querySelector('#monthly-summary .monthly-value');
  if (monthlyValue) {
    monthlyValue.textContent = `Rp ${monthlySummary.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
}

function renderTransactionList() {
  const sortedTransactions = getSortedTransactions(AppState.transactions, AppState.sortOrder);
  const listElement = document.getElementById('transaction-list');
  
  if (!listElement) return;

  if (sortedTransactions.length === 0) {
    listElement.innerHTML = '<li class="empty-message">Belum ada transaksi yang tercatat.</li>';
    return;
  }

  listElement.innerHTML = sortedTransactions.map(tx => `
    <li>
      <div class="transaction-info">
        <div class="transaction-name">${escapeHtml(tx.name)}</div>
        <div class="transaction-amount">Rp ${tx.amount.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</div>
        <span class="transaction-category">${escapeHtml(tx.category)}</span>
        <div class="transaction-date">${formatDate(tx.date)}</div>
      </div>
      <button class="btn-delete" onclick="handleDeleteTransaction('${tx.id}')">Delete</button>
    </li>
  `).join('');
}

function renderPieChart() {
  const pieData = computePieData(AppState.transactions);
  ChartManager.update(pieData);
}

function renderCategoryDropdown() {
  const select = document.getElementById('select-category');
  if (!select) return;

  const currentValue = select.value;
  
  select.innerHTML = '<option value="">Pilih kategori...</option>' +
    AppState.categories.map(cat => 
      `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`
    ).join('');

  // Restore previous value if it still exists
  if (currentValue && AppState.categories.includes(currentValue)) {
    select.value = currentValue;
  }
}

function renderBudgetInput() {
  const budgetInput = document.getElementById('input-budget');
  if (budgetInput && AppState.budgetLimit > 0) {
    budgetInput.value = formatNumberWithThousandsSeparator(AppState.budgetLimit.toString());
  }
}

function renderTheme() {
  document.documentElement.setAttribute('data-theme', AppState.theme);
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.textContent = AppState.theme === 'light' ? '🌙' : '☀️';
  }
}

function render() {
  renderBalance();
  renderMonthlySummary();
  renderTransactionList();
  renderPieChart();
  renderCategoryDropdown();
  renderBudgetInput();
}

// ===== Utility Functions =====
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('id-ID', options);
}

function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
  }
}

function clearError(elementId) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = '';
  }
}

function clearAllErrors() {
  ['error-name', 'error-amount', 'error-custom-category', 'error-budget'].forEach(clearError);
}

function showStorageError(message) {
  console.error(message);
  alert(message);
}

// ===== Event Handlers =====
function handleAddTransaction(event) {
  event.preventDefault();
  clearAllErrors();

  const nameInput = document.getElementById('input-name');
  const amountInput = document.getElementById('input-amount');
  const categorySelect = document.getElementById('select-category');

  const nameValue = nameInput.value;
  const amountValue = amountInput.value;
  const categoryValue = categorySelect.value;

  // Validate
  const nameValidation = Validator.validateName(nameValue);
  const amountValidation = Validator.validateAmount(amountValue);

  let isValid = true;

  if (!nameValidation.valid) {
    showError('error-name', nameValidation.message);
    isValid = false;
  }

  if (!amountValidation.valid) {
    showError('error-amount', amountValidation.message);
    isValid = false;
  }

  if (!categoryValue) {
    isValid = false;
  }

  if (!isValid) {
    return;
  }

  // Parse formatted amount to number
  const numericAmount = parseFormattedNumber(amountValue);
  
  // Add transaction
  addTransaction(nameValue, numericAmount, categoryValue);

  // Reset form
  nameInput.value = '';
  amountInput.value = '';
  categorySelect.value = '';
}

function handleDeleteTransaction(id) {
  if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
    deleteTransaction(id);
  }
}

function handleAddCustomCategory() {
  const input = document.getElementById('custom-category-input');
  if (input && input.value.trim()) {
    addCustomCategory(input.value);
  }
}

function handleBudgetChange(event) {
  clearError('error-budget');
  const value = event.target.value;
  
  const validation = Validator.validateBudget(value);
  
  if (!validation.valid) {
    showError('error-budget', validation.message);
    return;
  }

  setBudgetLimit(value);
}

function handleSortChange(event) {
  setSortOrder(event.target.value);
}

function handleThemeToggle() {
  toggleTheme();
}

// ===== Initialization =====
function initApp() {
  // Load data from storage
  StorageService.loadAll();

  // Apply theme before first render
  renderTheme();

  // Initial render
  render();

  // Initialize chart
  ChartManager.init('pie-chart');
  renderPieChart();

  // Event listeners
  const form = document.getElementById('transaction-form');
  if (form) {
    form.addEventListener('submit', handleAddTransaction);
  }

  const customCategoryBtn = document.getElementById('custom-category-btn');
  if (customCategoryBtn) {
    customCategoryBtn.addEventListener('click', handleAddCustomCategory);
  }

  const budgetInput = document.getElementById('input-budget');
  if (budgetInput) {
    budgetInput.addEventListener('input', handleNumberInput);
    budgetInput.addEventListener('blur', handleBudgetChange);
  }

  const amountInput = document.getElementById('input-amount');
  if (amountInput) {
    amountInput.addEventListener('input', handleNumberInput);
  }

  const sortSelect = document.getElementById('select-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', handleSortChange);
  }

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', handleThemeToggle);
  }

  // Clear errors on input
  const nameInput = document.getElementById('input-name');
  if (nameInput) {
    nameInput.addEventListener('input', () => clearError('error-name'));
  }
  
  if (amountInput) {
    amountInput.addEventListener('input', () => clearError('error-amount'));
  }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
