document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let state = {
        tasks: JSON.parse(localStorage.getItem('ff_tasks')) || ["", "", ""],
        taskStatus: JSON.parse(localStorage.getItem('ff_taskStatus')) || [false, false, false],
        streak: parseInt(localStorage.getItem('ff_streak')) || 0,
        lastActive: localStorage.getItem('ff_lastActive') || null,
        parkingLot: localStorage.getItem('ff_parkingLot') || "",
        mood: localStorage.getItem('ff_mood') || null,
        timerActive: false,
        timeLeft: 1500, // 25 mins
        timerInterval: null
    };

    // --- Breathing Guide Logic ---
    const breathInstruction = document.getElementById('breath-instruction');
    if (breathInstruction) {
        setInterval(() => {
            const current = breathInstruction.innerText;
            breathInstruction.innerText = current === "Breathe In..." ? "Breathe Out..." : "Breathe In...";
        }, 4000); // Matches CSS animation duration
    }

    // --- DOM Elements ---
    const taskInputs = document.querySelectorAll('.task-input');
    const taskCheckBtns = document.querySelectorAll('.btn-check');
    const taskSlots = document.querySelectorAll('.task-slot');
    const streakDisplay = document.getElementById('streak-count');
    const timerText = document.getElementById('timer-text');
    const timerToggleBtn = document.getElementById('timer-toggle');
    const timerResetBtn = document.getElementById('timer-reset');
    const timerModes = document.querySelectorAll('.mode-btn');
    const parkingLotArea = document.getElementById('parking-lot');
    const moodBtns = document.querySelectorAll('.mood-btn');
    const moodTip = document.getElementById('mood-suggestion');
    const premiumBtn = document.getElementById('btn-premium');
    const premiumModal = document.getElementById('premium-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const circularProgress = document.querySelector('.circular-progress');

    // --- Initialization ---
    function init() {
        updateStreak();
        renderTasks();
        parkingLotArea.value = state.parkingLot;
        if(state.mood) selectMood(state.mood);
        updateTimerDisplay();
    }

    // --- Task Logic ---
    function renderTasks() {
        state.tasks.forEach((content, index) => {
            taskInputs[index].value = content;
            if (state.taskStatus[index]) {
                taskSlots[index].classList.add('completed');
            } else {
                taskSlots[index].classList.remove('completed');
            }
        });
    }

    taskInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            state.tasks[index] = e.target.value;
            saveState();
        });
    });

    taskCheckBtns.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            state.taskStatus[index] = !state.taskStatus[index];
            taskSlots[index].classList.toggle('completed');
            saveState();
            checkAllTasksCompleted();
        });
    });

    function checkAllTasksCompleted() {
        const allDone = state.taskStatus.every(status => status === true);
        const someEntered = state.tasks.some(t => t.trim() !== "");
        
        if (allDone && someEntered) {
            // Trigger visual reward (confetti placeholder or simple alert)
            console.log("Zen achievement unlocked: All tasks complete.");
        }
    }

    // --- Streak Logic ---
    function updateStreak() {
        const today = new Date().toDateString();
        if (state.lastActive !== today) {
            // Check if it was yesterday to increment, otherwise reset if too long
            const lastDate = state.lastActive ? new Date(state.lastActive) : null;
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastDate && lastDate.toDateString() === yesterday.toDateString()) {
                // Keep streak
            } else if (lastDate) {
                // state.streak = 0; // Optional: Reset if more than 1 day missed
            }
            
            state.lastActive = today;
            saveState();
        }
        streakDisplay.innerText = state.streak;
    }

    // Increment streak manually if tasks are done (simplified for demo)
    function incrementStreakIfNewDay() {
        state.streak++;
        saveState();
        streakDisplay.innerText = state.streak;
    }

    // --- Timer Logic ---
    function updateTimerDisplay() {
        const minutes = Math.floor(state.timeLeft / 60);
        const seconds = state.timeLeft % 60;
        timerText.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Progress visualization
        const total = parseInt(document.querySelector('.mode-btn.active').dataset.time);
        const progress = ((total - state.timeLeft) / total) * 100;
        circularProgress.style.setProperty('--progress', progress);
    }

    function toggleTimer() {
        if (state.timerActive) {
            clearInterval(state.timerInterval);
            timerToggleBtn.innerText = "Start Focus";
            timerToggleBtn.classList.remove('btn-danger');
            timerToggleBtn.classList.add('btn-primary');
        } else {
            state.timerInterval = setInterval(() => {
                state.timeLeft--;
                updateTimerDisplay();
                if (state.timeLeft <= 0) {
                    clearInterval(state.timerInterval);
                    timerToggleBtn.innerText = "Start Focus";
                    state.timerActive = false;
                    alert("Focus session complete. Take a breath.");
                }
            }, 1000);
            timerToggleBtn.innerText = "Stop Session";
            timerToggleBtn.classList.remove('btn-primary');
            timerToggleBtn.classList.add('btn-danger');
        }
        state.timerActive = !state.timerActive;
    }

    timerToggleBtn.addEventListener('click', toggleTimer);
    timerResetBtn.addEventListener('click', () => {
        clearInterval(state.timerInterval);
        state.timerActive = false;
        timerToggleBtn.innerText = "Start Focus";
        const activeTime = parseInt(document.querySelector('.mode-btn.active').dataset.time);
        state.timeLeft = activeTime;
        updateTimerDisplay();
    });

    timerModes.forEach(mode => {
        mode.addEventListener('click', (e) => {
            timerModes.forEach(m => m.classList.remove('active'));
            mode.classList.add('active');
            state.timeLeft = parseInt(mode.dataset.time);
            updateTimerDisplay();
            if(state.timerActive) toggleTimer(); // Stop if running
        });
    });

    // --- Mood Logic ---
    const moodTips = {
        energetic: "Great energy! Attack your hardest task first (Eat the frog).",
        focused: "Flow state detected. Keep distractions at zero and dive deep.",
        tired: "Low fuel. Break your tasks into tiny sub-steps or take a 5-min walk.",
        anxious: "Breathe. Focus only on Task #1. The others can wait."
    };

    function selectMood(mood) {
        state.mood = mood;
        moodBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mood === mood);
        });
        moodTip.innerText = moodTips[mood] || "Select a mood for focus tips.";
        saveState();
    }

    moodBtns.forEach(btn => {
        btn.addEventListener('click', () => selectMood(btn.dataset.mood));
    });

    // --- Parking Lot ---
    parkingLotArea.addEventListener('input', (e) => {
        state.parkingLot = e.target.value;
        saveState();
    });

    // --- Modal Logic ---
    premiumBtn.addEventListener('click', () => premiumModal.style.display = 'block');
    closeModalBtn.addEventListener('click', () => premiumModal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === premiumModal) premiumModal.style.display = 'none';
    });

    // --- Helper Logic ---
    function saveState() {
        localStorage.setItem('ff_tasks', JSON.stringify(state.tasks));
        localStorage.setItem('ff_taskStatus', JSON.stringify(state.taskStatus));
        localStorage.setItem('ff_streak', state.streak);
        localStorage.setItem('ff_lastActive', state.lastActive);
        localStorage.setItem('ff_parkingLot', state.parkingLot);
        localStorage.setItem('ff_mood', state.mood);
    }

    init();
});
