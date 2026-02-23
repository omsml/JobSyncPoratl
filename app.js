let exploreJobs = [];
let savedJobs = [];
let appliedJobs = [];
let declinedJobs = [];
let viewMode = 'explore';

const brandDomains = {
    "TCS": "tata.com", "Zomato": "zomato.com", "CRED": "cred.club", "Swiggy": "swiggy.com",
    "Infosys": "infosys.com", "Wipro": "wipro.com", "Paytm": "paytm.com", "Razorpay": "razorpay.com",
    "Nykaa": "nykaa.com", "PhonePe": "phonepe.com", "Ola": "ola.com", "HDFC Bank": "hdfcbank.com",
    "Airtel": "airtel.in", "Flipkart": "flipkart.com", "Reliance": "ril.com"
};

const companies = Object.keys(brandDomains);
const cities = ["Bengaluru", "Mumbai", "Pune", "Delhi NCR", "Hyderabad", "Chennai", "Gurugram"];
const categories = ["IT", "Marketing", "Design", "Finance"];
const levels = ["Fresher", "Mid-level", "Senior"];

const titlesMap = {
    "IT": ["Java Backend Developer", "React Frontend Engineer", "Python Data Scientist", "Full Stack Developer", "Cloud Architect", "DevOps Engineer", "Mobile App Developer", "Software Test Engineer", "AI/ML Specialist", "Cybersecurity Analyst"],
    "Marketing": ["Digital Marketing Executive", "Social Media Manager", "Content Strategist", "SEO Specialist", "Brand Associate", "Performance Marketer", "Email Marketing Expert", "Growth Hacker", "PR Specialist", "Media Planner"],
    "Design": ["Product Designer", "UI/UX Designer", "Figma Specialist", "Graphic Designer", "Visual Storyteller", "Interaction Designer", "Motion Graphic Artist", "Web Designer", "Brand Designer", "Illustrator"],
    "Finance": ["Financial Analyst", "Corporate Accountant", "Tax Associate", "Investment Banker", "Risk Manager", "Audit Specialist", "Portfolio Manager", "Compliance Officer", "Budget Analyst", "Finance Associate"]
};

const mockDataPool = [];
categories.forEach(cat => {
    levels.forEach(lvl => {
        const titles = titlesMap[cat];
        for(let i = 0; i < 30; i++) {
            const comp = companies[i % companies.length];
            const city = cities[i % cities.length];
            const titleBase = titles[i % titles.length];
            mockDataPool.push({
                id: `${cat}-${lvl}-${i}`,
                title: i > 9 ? `${titleBase} (Batch ${Math.floor(i/10)})` : titleBase,
                company: comp,
                logoUrl: `https://www.google.com/s2/favicons?sz=128&domain=${brandDomains[comp]}`,
                location: city + ", India",
                salary: `₹${(Math.random() * 15 + (lvl === 'Senior' ? 25 : lvl === 'Mid-level' ? 12 : 5)).toFixed(1)} LPA`,
                category: cat,
                experience: lvl,
                longDescription: `As a professional member of the ${cat} team at ${comp}, you will contribute to critical infrastructure and growth strategies. This ${lvl} role in ${city} requires high attention to detail and technical proficiency. Join JobSync.in to synchronize your career goals with the best in the industry.`
            });
        }
    });
});

const jobList = document.getElementById('jobList');
const emptyState = document.getElementById('emptyState');
const resultStats = document.getElementById('resultStats');
const loader = document.getElementById('loader');
const btnText = document.getElementById('btnText');
const modalOverlay = document.getElementById('modalOverlay');
const modalContent = document.getElementById('modalContent');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

window.addEventListener('load', () => {
    fetchJobs();
    new Swiper(".testimonialSwiper", {
        pagination: { el: ".swiper-pagination", clickable: true },
        loop: true, autoplay: { delay: 4000 }
    });
});

document.getElementById('refreshFeedBtn').addEventListener('click', () => fetchJobs());
document.getElementById('unifiedSearchForm').addEventListener('submit', (e) => { 
    e.preventDefault(); 
    switchView('explore'); 
    fetchJobs(); 
});

function quickSearch(keyword) {
    document.getElementById('searchInput').value = keyword;
    document.getElementById('job-portal').scrollIntoView({ behavior: 'smooth' });
    switchView('explore');
    fetchJobs();
}

function switchView(mode) {
    viewMode = mode;
    ['explore', 'saved', 'applied'].forEach(m => {
        const btn = document.getElementById(`nav-${m}`);
        if (btn) {
            if (m === mode) btn.classList.add('active-nav');
            else btn.classList.remove('active-nav');
        }
    });
    document.getElementById('viewTitle').textContent = 
        mode === 'explore' ? 'Featured Opportunities' : 
        mode === 'saved' ? 'Saved Jobs' : 'Applied History';
    renderCurrentView();
}

async function fetchJobs() {
    setLoading(true);
    setTimeout(() => {
        const query = document.getElementById('searchInput').value.toLowerCase().trim();
        const category = document.getElementById('categoryFilter').value;
        const level = document.getElementById('levelFilter').value;

        const actedUponIds = new Set([
            ...savedJobs.map(j => j.id), 
            ...appliedJobs.map(j => j.id), 
            ...declinedJobs.map(j => j.id)
        ]);

        let filtered = mockDataPool.filter(job => {
            if (actedUponIds.has(job.id)) return false;
            if (category && job.category !== category) return false;
            if (level && job.experience !== level) return false;
            if (query) {
                return (
                    job.title.toLowerCase().includes(query) || 
                    job.company.toLowerCase().includes(query) ||
                    job.category.toLowerCase().includes(query)
                );
            }
            return true;
        });

        exploreJobs = filtered.sort(() => 0.5 - Math.random()).slice(0, 30);
        renderCurrentView();
        setLoading(false);
    }, 500);
}

function setLoading(isLoading) {
    loader.classList.toggle('hidden', !isLoading);
    btnText.classList.toggle('hidden', isLoading);
    jobList.style.opacity = isLoading ? '0.2' : '1';
}

function renderCurrentView() {
    let data = (viewMode === 'explore') ? exploreJobs : (viewMode === 'saved') ? savedJobs : appliedJobs;
    let msg = (viewMode === 'explore') ? "No matching jobs in JobSync database." : (viewMode === 'saved') ? "You haven't saved any jobs yet." : "No application records found.";
    
    resultStats.textContent = `Showing ${data.length} Results`;
    if (data.length === 0) {
        jobList.innerHTML = "";
        emptyState.classList.remove('hidden');
        document.getElementById('emptyMsg').textContent = msg;
    } else {
        emptyState.classList.add('hidden');
        renderJobs(data);
    }
}

function renderJobs(jobs) {
    jobList.innerHTML = jobs.map((job, idx) => {
        let actionBtn = `<button onclick="openModal('${job.id}')" class="w-full md:w-auto px-8 py-3 bg-white text-slate-900 rounded-2xl font-black text-sm hover:bg-blue-600 hover:text-white transition-all shadow-lg border border-white/10">View Details</button>`;
        return `
        <div class="job-card bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:border-blue-500/50 hover:bg-white/10 transition-all group" style="animation-delay: ${idx * 0.03}s">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div class="flex gap-5 cursor-pointer" onclick="openModal('${job.id}')">
                    <div class="w-16 h-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-lg p-3">
                        <img src="${job.logoUrl}" alt="${job.company}" class="w-full h-full object-contain">
                    </div>
                    <div>
                        <h3 class="text-xl font-black text-white group-hover:text-blue-400 transition-colors mb-1">${job.title}</h3>
                        <p class="text-blue-500 font-bold text-sm mb-3 uppercase tracking-widest">${job.company} • ${job.experience}</p>
                        <div class="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
                            <span class="flex items-center gap-1"><i class="ri-map-pin-line text-blue-500"></i> ${job.location}</span>
                            <span class="flex items-center gap-1 text-green-400"><i class="ri-money-dollar-circle-line"></i> ${job.salary}</span>
                            <span class="bg-white/5 text-slate-400 px-3 py-1 rounded-lg uppercase tracking-tight">${job.category}</span>
                        </div>
                    </div>
                </div>
                ${actionBtn}
            </div>
        </div>`;
    }).join('');
}

function openModal(jobId) {
    const all = [...mockDataPool, ...exploreJobs, ...savedJobs, ...appliedJobs, ...declinedJobs];
    const job = all.find(j => j.id === jobId);
    if (!job) return;

    const isSaved = savedJobs.some(j => j.id === job.id);
    const saveBtnHtml = isSaved ? '' : `<button onclick="handleAction('saved', '${job.id}')" class="flex-1 py-4 bg-slate-100 text-slate-900 font-black rounded-2xl hover:bg-slate-200 transition-all">Save for Later</button>`;

    modalContent.innerHTML = `
        <div class="p-10 border-b flex justify-between items-start bg-slate-50">
            <div class="flex gap-5 items-center">
                <div class="w-20 h-20 bg-white border border-slate-100 rounded-3xl flex items-center justify-center shadow-sm p-4">
                     <img src="${job.logoUrl}" class="w-full h-full object-contain">
                </div>
                <div>
                    <h2 class="text-3xl font-black text-slate-900 leading-tight">${job.title}</h2>
                    <p class="text-blue-600 font-black text-sm uppercase tracking-widest mt-1">${job.company}</p>
                </div>
            </div>
            <button onclick="closeModal()" class="p-3 hover:bg-slate-200 rounded-full transition-all text-slate-400"><i class="ri-close-line text-2xl"></i></button>
        </div>
        <div class="p-10 overflow-y-auto space-y-8 flex-1">
            <div class="grid grid-cols-2 gap-6">
                <div class="p-5 bg-blue-50 rounded-3xl border border-blue-100">
                    <p class="text-[10px] text-blue-400 font-black uppercase mb-1 tracking-widest">Comp</p>
                    <p class="text-xl font-black text-blue-700">${job.salary}</p>
                </div>
                <div class="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <p class="text-[10px] text-slate-400 font-black uppercase mb-1 tracking-widest">Level</p>
                    <p class="text-xl font-black text-slate-800">${job.experience}</p>
                </div>
            </div>
            <div>
                <h4 class="font-black text-slate-900 text-xl mb-4 flex items-center gap-2">
                    <span class="w-1.5 h-6 bg-blue-600 rounded-full"></span> Insight
                </h4>
                <p class="text-slate-600 font-medium leading-relaxed">${job.longDescription}</p>
            </div>
        </div>
        <div class="p-10 bg-white border-t flex gap-4">
            <button onclick="handleAction('applied', '${job.id}')" class="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-2xl transition-all">Quick Apply</button>
            ${saveBtnHtml}
        </div>`;
    modalOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() { modalOverlay.classList.add('hidden'); document.body.style.overflow = 'auto'; }

function handleAction(type, jobId) {
    const all = [...mockDataPool, ...exploreJobs, ...savedJobs, ...appliedJobs, ...declinedJobs];
    const job = all.find(j => j.id === jobId);
    if (!job) return;

    exploreJobs = exploreJobs.filter(j => j.id !== jobId);
    savedJobs = savedJobs.filter(j => j.id !== jobId);
    appliedJobs = appliedJobs.filter(j => j.id !== jobId);

    if (type === 'applied') { appliedJobs.push(job); showToast("Applied successfully on JobSync.in!"); }
    else if (type === 'saved') { savedJobs.push(job); showToast("Opportunity synced to your profile!"); }
    
    closeModal();
    renderCurrentView();
}

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

// Mobile Menu Logic
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const menuIcon = document.getElementById('menuIcon');

// Toggle Menu on Click
mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    
    // Swap icon between Hamburger and Close (X)
    if(mobileMenu.classList.contains('hidden')) {
        menuIcon.classList.replace('ri-close-large-line', 'ri-menu-4-line');
    } else {
        menuIcon.classList.replace('ri-menu-4-line', 'ri-close-large-line');
    }
});

// Function to close menu when a link is clicked
function closeMobileMenu() {
    mobileMenu.classList.add('hidden');
    menuIcon.classList.replace('ri-close-large-line', 'ri-menu-4-line');

}
