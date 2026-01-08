// NLP Memo Accounting Diary - Main JavaScript
// 基于自然语言处理的智能记账日记应用

// 全局变量
let currentTransaction = null;
let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
let diaries = JSON.parse(localStorage.getItem('diaries') || '[]');
let todayChart = null;

// NLP API 配置
const NLP_API_KEY = 'sk-F4lstd0mq2fPOsmIqzRSPtjYw4rstmIgsXXi66sHDbkWZKPx';
const NLP_API_URL = 'https://api.chatanywhere.tech/v1';

// 分类配置
const CATEGORIES = {
    expense: [
        { id: 'food', name: '餐饮', icon: '🍽️', color: '#FF6B6B' },
        { id: 'transport', name: '交通', icon: '🚗', color: '#4ECDC4' },
        { id: 'shopping', name: '购物', icon: '🛍️', color: '#45B7D1' },
        { id: 'entertainment', name: '娱乐', icon: '🎬', color: '#96CEB4' },
        { id: 'health', name: '医疗', icon: '🏥', color: '#FFEAA7' },
        { id: 'education', name: '教育', icon: '📚', color: '#DDA0DD' },
        { id: 'housing', name: '居住', icon: '🏠', color: '#98D8C8' },
        { id: 'other', name: '其他', icon: '📝', color: '#F7DC6F' }
    ],
    income: [
        { id: 'salary', name: '工资', icon: '💼', color: '#27AE60' },
        { id: 'bonus', name: '奖金', icon: '🎁', color: '#E74C3C' },
        { id: 'investment', name: '投资', icon: '📈', color: '#3498DB' },
        { id: 'other_income', name: '其他', icon: '💰', color: '#F39C12' }
    ]
};

// P5.js 背景动画
function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('p5-background');
    canvas.style('position', 'fixed');
    canvas.style('top', '0');
    canvas.style('left', '0');
    canvas.style('z-index', '-1');
}

function draw() {
    // 创建动态粒子背景
    clear();
    
    // 粒子系统
    for (let i = 0; i < 50; i++) {
        let x = (noise(i * 0.01, frameCount * 0.005) * width);
        let y = (noise(i * 0.01 + 100, frameCount * 0.005) * height);
        let size = noise(i * 0.01 + 200, frameCount * 0.005) * 8 + 2;
        
        fill(255, 255, 255, 30);
        noStroke();
        ellipse(x, y, size, size);
        
        // 连接线
        for (let j = i + 1; j < min(i + 5, 50); j++) {
            let x2 = (noise(j * 0.01, frameCount * 0.005) * width);
            let y2 = (noise(j * 0.01 + 100, frameCount * 0.005) * height);
            let distance = dist(x, y, x2, y2);
            
            if (distance < 100) {
                stroke(255, 255, 255, 20);
                strokeWeight(1);
                line(x, y, x2, y2);
            }
        }
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化应用
function initializeApp() {
    setupMobileMenu();
    setupScrollReveal();
    setupCategorySelector();
    updateTodayOverview();
    loadRecentTransactions();
    initializeTodayChart();
    setupAnimations();
    
    // 设置输入框自动解析
    const naturalInput = document.getElementById('natural-input');
    if (naturalInput) {
        naturalInput.addEventListener('input', debounce(autoParse, 1000));
    }
}

// 移动端菜单设置
function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
}

// 滚动显示动画
function setupScrollReveal() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.scroll-reveal').forEach(el => {
        observer.observe(el);
    });
}

// 设置分类选择器
function setupCategorySelector() {
    const categorySelector = document.getElementById('category-selector');
    if (!categorySelector) return;
    
    categorySelector.innerHTML = '';
    
    // 默认显示支出分类
    CATEGORIES.expense.forEach(category => {
        const chip = document.createElement('div');
        chip.className = 'category-chip p-3 rounded-lg border-2 border-gray-200 cursor-pointer text-center hover:border-blue-300 transition-all';
        chip.innerHTML = `
            <div class="text-2xl mb-1">${category.icon}</div>
            <div class="text-sm font-medium">${category.name}</div>
        `;
        chip.onclick = () => selectCategory(category, chip);
        categorySelector.appendChild(chip);
    });
}

// 选择分类
function selectCategory(category, element) {
    // 移除其他选中状态
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    
    // 添加选中状态
    element.classList.add('active');
    
    // 更新当前交易记录
    if (currentTransaction) {
        currentTransaction.category = category.id;
        currentTransaction.categoryName = category.name;
        currentTransaction.categoryIcon = category.icon;
        
        // 启用保存按钮
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.disabled = false;
        }
    }
}

// 设置示例输入
function setExample(text) {
    const naturalInput = document.getElementById('natural-input');
    if (naturalInput) {
        naturalInput.value = text;
        parseInput();
    }
}

// 解析输入
async function parseInput() {
    const input = document.getElementById('natural-input').value.trim();
    if (!input) return;
    
    showLoadingState();
    
    try {
        const result = await callNLPService(input);
        displayParsedResult(result);
        currentTransaction = result;
        
        // 自动选择分类
        if (result.category) {
            setTimeout(() => {
                autoSelectCategory(result.category);
            }, 500);
        }
        
    } catch (error) {
        console.error('NLP解析失败:', error);
        showError('解析失败，请检查输入或稍后重试');
    }
}

// 自动解析（防抖）
function autoParse() {
    const input = document.getElementById('natural-input').value.trim();
    if (input && input.length > 3) {
        parseInput();
    }
}

// 调用NLP服务
async function callNLPService(text) {
    // 模拟NLP解析（实际项目中调用真实API）
    // const response = await fetch(`${NLP_API_URL}/chat/completions`, {
    //     method: 'POST',
    //     headers: {
    //         'Authorization': `Bearer ${NLP_API_KEY}`,
    //         'Content-Type': 'application/json'
    //     },
    //     body: JSON.stringify({
    //         model: 'gpt-3.5-turbo',
    //         messages: [{
    //             role: 'system',
    //             content: '你是一个财务记账助手，请从用户输入中提取金额、类型(收入/支出)、分类、描述等信息，返回JSON格式。'
    //         }, {
    //             role: 'user',
    //             content: text
    //         }]
    //     })
    // });
    
    // 模拟解析逻辑
    return simulateNLPParsing(text);
}

// 模拟NLP解析（演示用）
function simulateNLPParsing(text) {
    const amountMatch = text.match(/(\d+(?:\.\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    
    let type = 'expense';
    let category = 'other';
    let categoryName = '其他';
    let categoryIcon = '📝';
    
    // 简单的关键词匹配
    const expenseKeywords = {
        '午餐': { id: 'food', name: '餐饮', icon: '🍽️' },
        '晚餐': { id: 'food', name: '餐饮', icon: '🍽️' },
        '早餐': { id: 'food', name: '餐饮', icon: '🍽️' },
        '地铁': { id: 'transport', name: '交通', icon: '🚗' },
        '公交': { id: 'transport', name: '交通', icon: '🚗' },
        '打车': { id: 'transport', name: '交通', icon: '🚗' },
        '购物': { id: 'shopping', name: '购物', icon: '🛍️' },
        '电影': { id: 'entertainment', name: '娱乐', icon: '🎬' },
        '医院': { id: 'health', name: '医疗', icon: '🏥' },
        '书': { id: 'education', name: '教育', icon: '📚' }
    };
    
    const incomeKeywords = {
        '工资': { id: 'salary', name: '工资', icon: '💼' },
        '奖金': { id: 'bonus', name: '奖金', icon: '🎁' },
        '收入': { id: 'other_income', name: '其他', icon: '💰' }
    };
    
    // 检查收入关键词
    for (const [keyword, cat] of Object.entries(incomeKeywords)) {
        if (text.includes(keyword)) {
            type = 'income';
            category = cat.id;
            categoryName = cat.name;
            categoryIcon = cat.icon;
            break;
        }
    }
    
    // 检查支出关键词
    if (type === 'expense') {
        for (const [keyword, cat] of Object.entries(expenseKeywords)) {
            if (text.includes(keyword)) {
                category = cat.id;
                categoryName = cat.name;
                categoryIcon = cat.icon;
                break;
            }
        }
    }
    
    return {
        id: generateId(),
        date: new Date().toISOString().split('T')[0],
        amount: amount,
        type: type,
        category: category,
        categoryName: categoryName,
        categoryIcon: categoryIcon,
        description: text.replace(/\d+(?:\.\d+)?/g, '').replace(/[元块]/g, '').trim() || categoryName,
        rawText: text,
        createdAt: new Date().toISOString()
    };
}

// 显示解析结果
function displayParsedResult(result) {
    const resultContainer = document.getElementById('parsed-result');
    if (!resultContainer) return;
    
    resultContainer.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span class="text-sm font-medium text-gray-600">类型</span>
                <span class="text-sm font-semibold ${result.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                    ${result.type === 'income' ? '收入' : '支出'}
                </span>
            </div>
            <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span class="text-sm font-medium text-gray-600">金额</span>
                <span class="text-lg font-bold text-gray-800">¥${result.amount.toFixed(2)}</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span class="text-sm font-medium text-gray-600">分类</span>
                <div class="flex items-center">
                    <span class="text-lg mr-2">${result.categoryIcon}</span>
                    <span class="text-sm font-semibold text-gray-800">${result.categoryName}</span>
                </div>
            </div>
            <div class="p-3 bg-gray-50 rounded-lg">
                <span class="text-sm font-medium text-gray-600">描述</span>
                <p class="text-sm text-gray-800 mt-1">${result.description}</p>
            </div>
        </div>
    `;
    
    // 添加动画效果
    anime({
        targets: resultContainer.children,
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(100),
        duration: 500,
        easing: 'easeOutQuad'
    });
}

// 自动选择分类
function autoSelectCategory(categoryId) {
    const categoryChips = document.querySelectorAll('.category-chip');
    categoryChips.forEach((chip, index) => {
        const category = CATEGORIES.expense[index];
        if (category && category.id === categoryId) {
            chip.click();
        }
    });
}

// 显示加载状态
function showLoadingState() {
    const resultContainer = document.getElementById('parsed-result');
    if (resultContainer) {
        resultContainer.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span class="ml-3 text-gray-600">正在解析...</span>
            </div>
        `;
    }
}

// 显示错误信息
function showError(message) {
    const resultContainer = document.getElementById('parsed-result');
    if (resultContainer) {
        resultContainer.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <svg class="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p>${message}</p>
            </div>
        `;
    }
}

// 保存交易记录
function saveTransaction() {
    if (!currentTransaction) {
        showNotification('请先输入记账信息', 'error');
        return;
    }
    
    // 添加到交易记录
    transactions.unshift(currentTransaction);
    
    // 保存到本地存储
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    // 更新界面
    updateTodayOverview();
    loadRecentTransactions();
    updateTodayChart();
    
    // 重置表单
    resetForm();
    
    // 显示成功消息
    showNotification('记账成功！', 'success');
    
    // 添加保存动画
    anime({
        targets: '#save-btn',
        scale: [1, 0.95, 1],
        duration: 200,
        easing: 'easeInOutQuad'
    });
}

// 重置表单
function resetForm() {
    document.getElementById('natural-input').value = '';
    document.getElementById('parsed-result').innerHTML = `
        <div class="text-center text-gray-400 py-8">
            <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p>输入内容后将自动解析</p>
        </div>
    `;
    document.getElementById('save-btn').disabled = true;
    
    // 重置分类选择器
    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    
    currentTransaction = null;
}

// 更新今日概览
function updateTodayOverview() {
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter(t => t.date === today);
    
    let income = 0;
    let expense = 0;
    
    todayTransactions.forEach(t => {
        if (t.type === 'income') {
            income += t.amount;
        } else {
            expense += t.amount;
        }
    });
    
    const balance = income - expense;
    
    // 更新显示
    animateNumber('today-income', income);
    animateNumber('today-expense', expense);
    animateNumber('today-balance', balance);
    animateNumber('today-count', todayTransactions.length);
}

// 数字滚动动画
function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = parseFloat(element.textContent.replace(/[¥,]/g, '')) || 0;
    
    anime({
        targets: { value: startValue },
        value: targetValue,
        duration: 1000,
        easing: 'easeOutQuad',
        update: function(anim) {
            const currentValue = anim.animatables[0].target.value;
            if (elementId === 'today-count') {
                element.textContent = Math.round(currentValue);
            } else {
                element.textContent = '¥' + currentValue.toFixed(2);
            }
        }
    });
}

// 加载最近交易记录
function loadRecentTransactions() {
    const container = document.getElementById('recent-transactions');
    if (!container) return;
    
    const recentTransactions = transactions.slice(0, 30);
    
    if (recentTransactions.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <p>暂无记账记录</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentTransactions.map(transaction => `
        <div class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow group">
            <div class="flex items-center">
                <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg mr-4" style="background-color: ${getCategoryColor(transaction.category)}">
                    ${transaction.categoryIcon}
                </div>
                <div>
                    <div class="font-medium text-gray-800">${transaction.description}</div>
                    <div class="text-sm text-gray-500">${formatDate(transaction.date)} • ${transaction.categoryName}</div>
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <div class="text-right">
                    <div class="font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}">
                        ${transaction.type === 'income' ? '+' : '-'}¥${transaction.amount.toFixed(2)}
                    </div>
                </div>
                <button 
                    onclick="deleteTransactionFromHome('${transaction.id}')" 
                    class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 transition-opacity"
                    title="删除记录"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// 获取分类颜色
function getCategoryColor(categoryId) {
    const allCategories = [...CATEGORIES.expense, ...CATEGORIES.income];
    const category = allCategories.find(c => c.id === categoryId);
    return category ? category.color + '20' : '#F0F0F0';
}

// 初始化今日图表
function initializeTodayChart() {
    const chartContainer = document.getElementById('today-chart');
    if (!chartContainer) return;
    
    todayChart = echarts.init(chartContainer);
    updateTodayChart();
}

// 更新今日图表
function updateTodayChart() {
    if (!todayChart) return;
    
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter(t => t.date === today);
    
    // 按分类统计
    const categoryStats = {};
    todayTransactions.forEach(t => {
        if (t.type === 'expense') {
            const key = t.categoryName;
            categoryStats[key] = (categoryStats[key] || 0) + t.amount;
        }
    });
    
    const data = Object.entries(categoryStats).map(([name, value]) => ({
        name: name,
        value: value
    }));
    
    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
        },
        legend: {
            orient: 'horizontal',
            bottom: '0%',
            textStyle: {
                color: '#666'
            }
        },
        series: [
            {
                name: '今日支出',
                type: 'pie',
                radius: ['40%', '70%'],
                center: ['50%', '45%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 8,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: '18',
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: false
                },
                data: data.length > 0 ? data : [
                    { name: '暂无数据', value: 1, itemStyle: { color: '#E0E0E0' } }
                ],
                color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
            }
        ]
    };
    
    todayChart.setOption(option);
}

// 设置动画
function setupAnimations() {
    // 页面加载动画
    anime({
        targets: '.floating-animation',
        translateY: [-30, 0],
        opacity: [0, 1],
        duration: 1000,
        easing: 'easeOutQuad'
    });
    
    // 卡片悬停效果
    document.querySelectorAll('.hover-lift').forEach(card => {
        card.addEventListener('mouseenter', () => {
            anime({
                targets: card,
                translateY: -8,
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                duration: 300,
                easing: 'easeOutQuad'
            });
        });
        
        card.addEventListener('mouseleave', () => {
            anime({
                targets: card,
                translateY: 0,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                duration: 300,
                easing: 'easeOutQuad'
            });
        });
    });
}

// 显示通知
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    if (notification && notificationText) {
        notificationText.textContent = message;
        
        // 显示通知
        notification.style.transform = 'translateX(0)';
        
        // 3秒后隐藏
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
        }, 3000);
    }
}

// 滚动到功能区域
function scrollToFeature() {
    const featureSection = document.getElementById('accounting-panel');
    if (featureSection) {
        featureSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// 工具函数
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return '今天';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return '昨天';
    } else {
        return date.toLocaleDateString('zh-CN');
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 从主页删除交易记录
function deleteTransactionFromHome(id) {
    if (!confirm('确定要删除这条记录吗？')) return;
    
    // 从数组中删除
    transactions = transactions.filter(t => t.id !== id);
    
    // 保存到本地存储
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    // 更新界面
    updateTodayOverview();
    loadRecentTransactions();
    updateTodayChart();
    
    // 显示成功消息
    showNotification('记录已删除', 'success');
    
    // 添加删除动画
    anime({
        targets: `[onclick="deleteTransactionFromHome('${id}')"]`,
        scale: [1, 0.8, 1],
        duration: 200,
        easing: 'easeInOutQuad'
    });
}

// 导出函数供其他页面使用
window.NLPApp = {
    transactions,
    diaries,
    CATEGORIES,
    saveTransaction,
    updateTodayOverview,
    loadRecentTransactions,
    showNotification,
    formatDate,
    generateId,
    deleteTransactionFromHome
};