// ============================================
// STATE MANAGEMENT
// ============================================
let devices = [];
let chart = null;

// Load devices from localStorage on startup
window.addEventListener('DOMContentLoaded', () => {
    loadDevices();
    updateDeviceForm();
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .catch(err => console.log('Service Worker registration failed:', err));
    }
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.querySelector('.theme-toggle').textContent = '☀️';
    }
});

// ============================================
// SCREEN NAVIGATION
// ============================================
function startApp() {
    document.getElementById('welcomeScreen').classList.remove('active');
    document.getElementById('mainScreen').classList.add('active');
}

function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        document.getElementById('mainScreen').classList.remove('active');
        document.getElementById('welcomeScreen').classList.add('active');
    }
}

function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Remove active from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected page
    if (pageName === 'analysis') {
        document.getElementById('analysisPage').classList.add('active');
        document.getElementById('navAnalysis').classList.add('active');
    } else if (pageName === 'tips') {
        document.getElementById('tipsPage').classList.add('active');
        document.getElementById('navTips').classList.add('active');
    }
}

// ============================================
// THEME TOGGLE
// ============================================
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.querySelector('.theme-toggle').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Update chart colors if chart exists
    if (chart) {
        updateChart();
    }
}

// ============================================
// DEVICE FORM MANAGEMENT
// ============================================
function updateDeviceForm() {
    const deviceType = document.getElementById('deviceType').value;
    const formFields = document.getElementById('deviceFormFields');
    
    let html = '';
    
    switch(deviceType) {
        case 'fridge':
            html = `
                <div class="input-group">
                    <label for="yearlyKwh">Etiketteki Yıllık Tüketim (kWh/annum):</label>
                    <input type="number" id="yearlyKwh" value="274" min="0" step="1">
                    <small style="color: var(--text-secondary); display: block; margin-top: 0.25rem;">
                        Buzdolabı etiketindeki yıllık toplam kWh değeri
                    </small>
                </div>
            `;
            break;
            
        case 'washing':
        case 'dishwasher':
            const deviceName = deviceType === 'washing' ? 'Çamaşır Makinesi' : 'Bulaşık Makinesi';
            html = `
                <div class="input-group">
                    <label for="cycles100">100 Döngü Başına Tüketim (kWh):</label>
                    <input type="number" id="cycles100" value="50" min="0" step="1">
                    <small style="color: var(--text-secondary); display: block; margin-top: 0.25rem;">
                        Etiketlerdeki '100' simgesinin yanındaki değer
                    </small>
                </div>
                <div class="input-group">
                    <label for="weeklyUse">Haftalık Kullanım Sayısı:</label>
                    <input type="number" id="weeklyUse" value="3" min="1" max="14" step="1">
                </div>
            `;
            break;
            
        case 'ac':
            html = `
                <div class="input-group">
                    <label for="acYearly">Etiketteki Yıllık Isıtma/Soğutma Tüketimi (kWh/annum):</label>
                    <input type="number" id="acYearly" value="150" min="0" step="1">
                    <small style="color: var(--text-secondary); display: block; margin-top: 0.25rem;">
                        Klima etiketindeki mevsimsel kullanım değeri
                    </small>
                </div>
            `;
            break;
            
        case 'tv':
            html = `
                <div class="input-group">
                    <label for="tv1000h">1000 Saatlik Tüketim (kWh):</label>
                    <input type="number" id="tv1000h" value="60" min="0" step="1">
                    <small style="color: var(--text-secondary); display: block; margin-top: 0.25rem;">
                        TV etiketindeki '1000h' kutucuktaki değer
                    </small>
                </div>
                <div class="input-group">
                    <label for="dailyHours">Günlük TV İzleme Süresi (Saat):</label>
                    <input type="number" id="dailyHours" value="4" min="0.5" max="24" step="0.5">
                </div>
            `;
            break;
            
        case 'light':
            html = `
                <div class="input-group">
                    <label for="bulbWatt">Ampulün Gücü (Watt):</label>
                    <input type="number" id="bulbWatt" value="9" min="1" step="1">
                    <small style="color: var(--text-secondary); display: block; margin-top: 0.25rem;">
                        Ampul üzerindeki 5W, 9W, 12W gibi değer
                    </small>
                </div>
                <div class="input-group">
                    <label for="bulbCount">Aynı Tip Ampul Adedi:</label>
                    <input type="number" id="bulbCount" value="1" min="1" step="1">
                </div>
                <div class="input-group">
                    <label for="lightHours">Günlük Yanma Süresi (Saat):</label>
                    <input type="number" id="lightHours" value="5" min="0.5" max="24" step="0.5">
                </div>
            `;
            break;
            
        case 'other':
            html = `
                <div class="input-group">
                    <label for="deviceWatt">Cihazın Gücü (Watt):</label>
                    <input type="number" id="deviceWatt" value="2000" min="1" step="1">
                    <small style="color: var(--text-secondary); display: block; margin-top: 0.25rem;">
                        Cihazın arkasındaki metal plaka veya kutudaki W değeri
                    </small>
                </div>
                <div class="input-group">
                    <label for="deviceHours">Günlük Ortalama Kullanım (Saat):</label>
                    <input type="number" id="deviceHours" value="1" min="0.1" max="10" step="0.1">
                </div>
            `;
            break;
    }
    
    formFields.innerHTML = html;
}

// ============================================
// DEVICE CALCULATIONS
// ============================================
function calculateDevice(deviceType) {
    let watt = 0;
    let hours = 0;
    let name = '';
    
    switch(deviceType) {
        case 'fridge':
            name = 'Buzdolabı';
            const yearlyKwh = parseFloat(document.getElementById('yearlyKwh').value) || 274;
            const monthlyKwh = yearlyKwh / 12;
            watt = (monthlyKwh / 30) * 1000 / 24;
            hours = 24;
            break;
            
        case 'washing':
            name = 'Çamaşır Makinesi';
            const washCycles = parseFloat(document.getElementById('cycles100').value) || 50;
            const washWeekly = parseFloat(document.getElementById('weeklyUse').value) || 3;
            const washMonthlyKwh = (washCycles / 100) * washWeekly * 4.3;
            watt = (washMonthlyKwh / 30) * 1000;
            hours = 1;
            break;
            
        case 'dishwasher':
            name = 'Bulaşık Makinesi';
            const dishCycles = parseFloat(document.getElementById('cycles100').value) || 50;
            const dishWeekly = parseFloat(document.getElementById('weeklyUse').value) || 3;
            const dishMonthlyKwh = (dishCycles / 100) * dishWeekly * 4.3;
            watt = (dishMonthlyKwh / 30) * 1000;
            hours = 1;
            break;
            
        case 'ac':
            name = 'Klima';
            const acYearly = parseFloat(document.getElementById('acYearly').value) || 150;
            const acMonthlyKwh = acYearly / 12;
            watt = (acMonthlyKwh / 30) * 1000 / 24;
            hours = 24;
            break;
            
        case 'tv':
            name = 'TV';
            const tv1000h = parseFloat(document.getElementById('tv1000h').value) || 60;
            const dailyHours = parseFloat(document.getElementById('dailyHours').value) || 4;
            const tvMonthlyKwh = (tv1000h / 1000) * dailyHours * 30;
            watt = (tvMonthlyKwh / 30) * 1000 / dailyHours;
            hours = dailyHours;
            break;
            
        case 'light':
            name = 'Aydınlatma (Ampul)';
            const bulbWatt = parseFloat(document.getElementById('bulbWatt').value) || 9;
            const bulbCount = parseFloat(document.getElementById('bulbCount').value) || 1;
            const lightHours = parseFloat(document.getElementById('lightHours').value) || 5;
            watt = bulbWatt * bulbCount;
            hours = lightHours;
            break;
            
        case 'other':
            name = 'Fırın/Ütü/Süpürge';
            watt = parseFloat(document.getElementById('deviceWatt').value) || 2000;
            hours = parseFloat(document.getElementById('deviceHours').value) || 1;
            break;
    }
    
    return { name, watt, hours };
}

// ============================================
// ADD DEVICE
// ============================================
function addDevice() {
    const deviceType = document.getElementById('deviceType').value;
    const device = calculateDevice(deviceType);
    
    devices.push(device);
    saveDevices();
    updateDisplay();
    showToast(`✅ ${device.name} hesaplamaya dahil edildi!`);
}

// ============================================
// DELETE DEVICE
// ============================================
function deleteDevice(index) {
    const deviceName = devices[index].name;
    devices.splice(index, 1);
    saveDevices();
    updateDisplay();
    showToast(`🗑️ ${deviceName} silindi!`);
}

// ============================================
// UPDATE CALCULATIONS
// ============================================
function updateCalculations() {
    updateDisplay();
}

// ============================================
// UPDATE DISPLAY
// ============================================
function updateDisplay() {
    const unitPrice = parseFloat(document.getElementById('unitPrice').value) || 2.59;
    
    if (devices.length === 0) {
        document.getElementById('totalCostCard').style.display = 'none';
        document.getElementById('chartCard').style.display = 'none';
        document.getElementById('deviceListCard').style.display = 'none';
        return;
    }
    
    // Calculate costs
    const devicesWithCost = devices.map(device => ({
        ...device,
        cost: (device.watt / 1000) * device.hours * 30 * unitPrice
    }));
    
    const totalCost = devicesWithCost.reduce((sum, device) => sum + device.cost, 0);
    
    // Update total cost
    document.getElementById('totalAmount').textContent = totalCost.toFixed(2) + ' TL';
    document.getElementById('totalCostCard').style.display = 'block';
    
    // Update chart
    updateChart();
    document.getElementById('chartCard').style.display = 'block';
    
    // Update device list
    updateDeviceList(devicesWithCost);
    document.getElementById('deviceListCard').style.display = 'block';
}

// ============================================
// UPDATE CHART
// ============================================
function updateChart() {
    const unitPrice = parseFloat(document.getElementById('unitPrice').value) || 2.59;
    const devicesWithCost = devices.map(device => ({
        ...device,
        cost: (device.watt / 1000) * device.hours * 30 * unitPrice
    }));
    
    const ctx = document.getElementById('costChart').getContext('2d');
    
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#ffffff' : '#1a1a1a';
    
    if (chart) {
        chart.destroy();
    }
    
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: devicesWithCost.map(d => d.name),
            datasets: [{
                data: devicesWithCost.map(d => d.cost),
                backgroundColor: [
                    '#2E7D32',
                    '#4CAF50',
                    '#66BB6A',
                    '#81C784',
                    '#A5D6A7',
                    '#C8E6C9',
                    '#E8F5E9'
                ],
                borderWidth: 2,
                borderColor: isDark ? '#2a2a2a' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        padding: 15,
                        font: {
                            size: 12,
                            family: 'Inter'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed.toFixed(2) + ' TL';
                        }
                    }
                }
            }
        }
    });
}

// ============================================
// UPDATE DEVICE LIST
// ============================================
function updateDeviceList(devicesWithCost) {
    const listContainer = document.getElementById('deviceList');
    
    listContainer.innerHTML = devicesWithCost.map((device, index) => `
        <div class="device-item">
            <div class="device-info">
                <div class="device-name">${device.name}</div>
                <div class="device-details">
                    ${device.watt.toFixed(0)}W | Günlük ${device.hours} Saat
                </div>
            </div>
            <div class="device-cost">${device.cost.toFixed(2)} TL</div>
            <button class="btn-delete" onclick="deleteDevice(${index})">🗑️ Sil</button>
        </div>
    `).join('');
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// LOCAL STORAGE
// ============================================
function saveDevices() {
    localStorage.setItem('energyDevices', JSON.stringify(devices));
}

function loadDevices() {
    const saved = localStorage.getItem('energyDevices');
    if (saved) {
        devices = JSON.parse(saved);
        updateDisplay();
    }
}
