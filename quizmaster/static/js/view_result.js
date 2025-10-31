/**
 * View Result - Quiz Results Analytics Interface
 * Handles chart display, filtering, searching, and CSV export
 */

// Initialize on page load
globalThis.addEventListener('DOMContentLoaded', () => {
    populateChart();
    setupSearch();
    setupFilters();
});

let currentFilter = 'all';

/**
 * Populate analytics chart with grade distribution
 */
function populateChart() {
    const container = document.getElementById('chartContainer');
    if (!container) return;
    
    container.innerHTML = '';

    // Use data passed from Django template
    const chartData = gradeDistribution || [
        { label: '90-100', count: 0 },
        { label: '80-89', count: 0 },
        { label: '70-79', count: 0 },
        { label: '60-69', count: 0 },
        { label: '50-59', count: 0 },
        { label: '0-49', count: 0 }
    ];

    const maxCount = Math.max(...chartData.map(r => r.count), 1);

    for (const [index, range] of chartData.entries()) {
        const height = (range.count / maxCount) * 100;
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `${height}%`;
        bar.style.animationDelay = `${index * 0.1}s`;
        
        const value = document.createElement('span');
        value.className = 'chart-value';
        value.textContent = range.count;
        
        const label = document.createElement('span');
        label.className = 'chart-label';
        label.textContent = range.label;
        
        bar.appendChild(value);
        bar.appendChild(label);
        container.appendChild(bar);
    }
}

/**
 * Get filter type based on button text
 * @param {string} text - Button text
 * @returns {string} Filter type
 */
function getFilterType(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('pass')) return 'passed';
    if (lowerText.includes('fail')) return 'failed';
    return 'all';
}

/**
 * Filter results by status
 * @param {string} filter - Filter type (all, passed, failed)
 */
function filterResults(filter) {
    currentFilter = filter;
    
    // Update active button
    const filterButtons = document.querySelectorAll('.filter-btn');
    for (const btn of filterButtons) {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(filter)) {
            btn.classList.add('active');
        }
    }

    applyFilters();
}

/**
 * Apply filters and search to results table
 */
function applyFilters() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const rows = document.querySelectorAll('#resultsTableBody tr');
    
    for (const row of rows) {
        const percentage = Number.parseFloat(row.dataset.percentage);
        const student = row.dataset.student?.toLowerCase() ?? '';
        const email = row.dataset.email?.toLowerCase() ?? '';
        
        let showRow = true;
        
        // Apply filter
        if (currentFilter === 'passed') {
            showRow = percentage >= ((quizData.passingMarks / quizData.totalMarks) * 100);
        } else if (currentFilter === 'failed') {
            showRow = percentage < ((quizData.passingMarks / quizData.totalMarks) * 100);
        }
        
        // Apply search
        if (searchTerm && showRow) {
            showRow = student.includes(searchTerm) || email.includes(searchTerm);
        }
        
        row.style.display = showRow ? '' : 'none';
    }
}

/**
 * Setup search functionality
 */
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
}

/**
 * Setup filter buttons
 */
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    for (const btn of filterButtons) {
        btn.addEventListener('click', function() {
            const filter = getFilterType(this.textContent);
            filterResults(filter);
        });
    }
}

/**
 * Export results to CSV file
 */
function exportResults() {
    const rows = document.querySelectorAll('#resultsTableBody tr:not([style*="display: none"])');
    
    if (rows.length === 0 || (rows.length === 1 && rows[0].querySelector('[colspan]'))) {
        alert('No results to export');
        return;
    }
    
    let csv = 'Student Name,Email,Score,Max Score,Percentage,Time Taken,Submitted On\n';
    
    for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length > 1) {
            const studentName = cells[0].querySelector('.student-info span')?.textContent ?? '';
            const email = cells[1].textContent;
            const score = cells[2].textContent;
            const percentage = cells[3].textContent.replace('%', '');
            const timeTaken = cells[4].textContent;
            const submittedOn = cells[5].textContent;
            
            csv += `"${studentName}","${email}","${score}","${percentage}%","${timeTaken}","${submittedOn}"\n`;
        }
    }
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = globalThis.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quizData.title}_Results.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    globalThis.URL.revokeObjectURL(url);
    
    alert('✅ Results exported successfully!');
}

/**
 * Video background fallback
 */
const video = document.querySelector('.video-background video');
if (video) {
    video.addEventListener('error', () => {
        console.log('Video failed to load. Using gradient background.');
        const videoBg = document.querySelector('.video-background');
        if (videoBg) {
            videoBg.style.display = 'none';
        }
    });
}
