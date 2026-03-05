// js/app.js - 主应用逻辑
const App = {
    currentPage: 'questions',
    examState: {
        isActive: false,
        questions: [],
        currentIndex: 0,
        answers: [],
        recordings: [],
        startTime: null,
        timerInterval: null,
        remainingTime: 0
    },

    init() {
        this.bindEvents();
        this.loadPage('questions');
        this.renderQuestionList();
        this.renderRecordsList();
        this.loadSettings();
    },

    // 绑定事件
    bindEvents() {
        // 导航
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.target.dataset.page;
                this.loadPage(page);
            });
        });

        // 题库管理
        document.getElementById('btn-add').addEventListener('click', () => this.showAddModal());
        document.getElementById('btn-import').addEventListener('click', () => this.showImportModal());
        document.getElementById('btn-export').addEventListener('click', () => this.exportQuestions());
        document.getElementById('btn-clear').addEventListener('click', () => this.clearQuestions());

        // 添加题目弹窗
        document.getElementById('btn-save-question').addEventListener('click', () => this.saveQuestion());
        document.getElementById('btn-cancel-add').addEventListener('click', () => this.hideModal('modal-add'));

        // 导入弹窗
        document.getElementById('import-type').addEventListener('change', (e) => {
            const customDiv = document.getElementById('custom-separator');
            customDiv.classList.toggle('hidden', e.target.value !== 'custom');
        });
        document.getElementById('btn-preview').addEventListener('click', () => this.previewImport());
        document.getElementById('btn-confirm-import').addEventListener('click', () => this.confirmImport());
        document.getElementById('btn-cancel-import').addEventListener('click', () => this.hideModal('modal-import'));

        // 答题页面
        document.getElementById('btn-start-exam').addEventListener('click', () => this.startExam());
        document.getElementById('btn-prev').addEventListener('click', () => this.prevQuestion());
        document.getElementById('btn-next').addEventListener('click', () => this.nextQuestion());
        document.getElementById('btn-submit').addEventListener('click', () => this.submitExam());
        document.getElementById('btn-record').addEventListener('click', () => this.toggleRecording());

        // 答题记录
        document.getElementById('btn-clear-records').addEventListener('click', () => this.clearRecords());

        // 设置
        document.getElementById('btn-save-settings').addEventListener('click', () => this.saveSettings());
    },

    // 切换页面
    loadPage(page) {
        this.currentPage = page;

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        document.querySelectorAll('.page').forEach(p => {
            p.classList.toggle('active', p.id === `page-${page}`);
        });

        if (page === 'exam') {
            this.loadExamSetup();
        } else if (page === 'questions') {
            this.renderQuestionList();
        } else if (page === 'records') {
            this.renderRecordsList();
        }
    },

    // ========== 题库管理 ==========

    renderQuestionList() {
        const questions = Storage.getQuestions();
        const list = document.getElementById('question-list');

        if (questions.length === 0) {
            list.innerHTML = '<p class="empty">暂无题目，请添加或导入</p>';
            return;
        }

        list.innerHTML = questions.map((q, i) => `
            <div class="question-item" data-index="${i}">
                <p>${this.escapeHtml(q)}</p>
                <div class="actions">
                    <button class="btn btn-sm" onclick="App.editQuestion(${i})">编辑</button>
                    <button class="btn btn-sm danger" onclick="App.deleteQuestion(${i})">删除</button>
                </div>
            </div>
        `).join('');
    },

    showAddModal() {
        document.getElementById('new-question').value = '';
        document.getElementById('modal-add').classList.add('active');
    },

    saveQuestion() {
        const content = document.getElementById('new-question').value.trim();
        if (!content) {
            alert('请输入题目内容');
            return;
        }
        Storage.addQuestion(content);
        this.hideModal('modal-add');
        this.renderQuestionList();
    },

    editQuestion(index) {
        const questions = Storage.getQuestions();
        const newContent = prompt('编辑题目:', questions[index]);
        if (newContent !== null && newContent.trim()) {
            Storage.editQuestion(index, newContent.trim());
            this.renderQuestionList();
        }
    },

    deleteQuestion(index) {
        if (confirm('确定删除这道题目吗？')) {
            Storage.deleteQuestion(index);
            this.renderQuestionList();
        }
    },

    clearQuestions() {
        if (confirm('确定清空所有题目吗？此操作不可恢复！')) {
            Storage.clearQuestions();
            this.renderQuestionList();
        }
    },

    // ========== 导入导出 ==========

    showImportModal() {
        document.getElementById('import-type').value = 'json';
        document.getElementById('import-content').value = '';
        document.getElementById('separator-input').value = '';
        document.getElementById('custom-separator').classList.add('hidden');
        document.getElementById('import-preview').classList.add('hidden');
        document.getElementById('modal-import').classList.add('active');
    },

    previewImport() {
        const type = document.getElementById('import-type').value;
        const content = document.getElementById('import-content').value.trim();
        const separator = document.getElementById('separator-input').value;

        if (!content) {
            alert('请输入题目内容');
            return;
        }

        let questions = [];

        try {
            if (type === 'json') {
                questions = JSON.parse(content);
                if (!Array.isArray(questions)) throw new Error('JSON格式错误，应为数组');
            } else if (type === 'txt') {
                questions = content.split('\n').filter(q => q.trim());
            } else if (type === 'excel') {
                questions = content.split('\n').filter(q => q.trim());
            } else if (type === 'custom') {
                if (!separator) {
                    alert('请输入分隔符');
                    return;
                }
                questions = content.split(separator).filter(q => q.trim());
            }

            if (questions.length === 0) {
                alert('未解析到任何题目');
                return;
            }

            // 显示预览
            document.getElementById('preview-count').textContent = questions.length;
            document.getElementById('preview-list').innerHTML = questions
                .slice(0, 10)
                .map(q => `<li>${this.escapeHtml(q.substring(0, 100))}${q.length > 100 ? '...' : ''}</li>`)
                .join('');

            if (questions.length > 10) {
                document.getElementById('preview-list').innerHTML += '<li>... 还有更多</li>';
            }

            document.getElementById('import-preview').classList.remove('hidden');
            document.getElementById('import-preview').dataset.questions = JSON.stringify(questions);

        } catch (error) {
            alert('解析失败: ' + error.message);
        }
    },

    confirmImport() {
        const previewEl = document.getElementById('import-preview');
        if (!previewEl.dataset.questions) {
            alert('请先点击预览');
            return;
        }

        const questions = JSON.parse(previewEl.dataset.questions);
        const existing = Storage.getQuestions();
        Storage.saveQuestions([...existing, ...questions]);

        this.hideModal('modal-import');
        this.renderQuestionList();
        alert(`成功导入 ${questions.length} 道题目`);
    },

    exportQuestions() {
        const questions = Storage.getQuestions();
        if (questions.length === 0) {
            alert('题库为空，无法导出');
            return;
        }

        const data = JSON.stringify(questions, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'questions.json';
        a.click();
        URL.revokeObjectURL(url);
    },

    // ========== 答题 ==========

    loadExamSetup() {
        const questions = Storage.getQuestions();
        const settings = Storage.getSettings();

        // 重置答题状态
        this.examState.isActive = false;
        document.getElementById('exam-setup').classList.remove('hidden');
        document.getElementById('exam-content').classList.add('hidden');

        if (questions.length === 0) {
            alert('请先添加题目');
            this.loadPage('questions');
            return;
        }

        document.getElementById('setting-count').value = settings.count;
        document.getElementById('setting-timer').value = settings.timer;
    },

    startExam() {
        const questions = Storage.getQuestions();
        const count = parseInt(document.getElementById('setting-count').value) || 5;
        const timer = parseInt(document.getElementById('setting-timer').value) || 20;

        if (questions.length < count) {
            alert(`题库题目不足，当前有 ${questions.length} 道题，请减少抽题数量`);
            return;
        }

        const selected = Storage.getRandomQuestions(count);

        this.examState = {
            isActive: true,
            questions: selected,
            currentIndex: 0,
            answers: new Array(selected.length).fill(''),
            recordings: new Array(selected.length).fill(null),
            startTime: Date.now(),
            timerInterval: null,
            remainingTime: timer * 60
        };

        document.getElementById('exam-setup').classList.add('hidden');
        document.getElementById('exam-content').classList.remove('hidden');
        document.getElementById('total-num').textContent = selected.length;

        this.renderCurrentQuestion();
        this.startTimer();
    },

    renderCurrentQuestion() {
        const state = this.examState;
        const q = state.questions[state.currentIndex];

        document.getElementById('current-num').textContent = state.currentIndex + 1;
        document.getElementById('exam-question').textContent = q;
        document.getElementById('answer-input').value = state.answers[state.currentIndex] || '';
        document.getElementById('btn-record').textContent = '🎤 开始录音';
        document.getElementById('recording-status').textContent = state.recordings[state.currentIndex] ? '已录音' : '';
        document.getElementById('recording-status').classList.remove('recording');

        // 上一题/下一题按钮状态
        document.getElementById('btn-prev').disabled = state.currentIndex === 0;
        document.getElementById('btn-next').disabled = state.currentIndex === state.questions.length - 1;
    },

    saveCurrentAnswer() {
        const answer = document.getElementById('answer-input').value;
        this.examState.answers[this.examState.currentIndex] = answer;
    },

    prevQuestion() {
        this.saveCurrentAnswer();
        if (this.examState.currentIndex > 0) {
            this.examState.currentIndex--;
            this.renderCurrentQuestion();
        }
    },

    nextQuestion() {
        this.saveCurrentAnswer();
        if (this.examState.currentIndex < this.examState.questions.length - 1) {
            this.examState.currentIndex++;
            this.renderCurrentQuestion();
        }
    },

    toggleRecording() {
        const btn = document.getElementById('btn-record');
        const status = document.getElementById('recording-status');

        if (Recorder.isRecording) {
            Recorder.stop().then(blob => {
                if (blob) {
                    Recorder.blobToBase64(blob).then(base64 => {
                        this.examState.recordings[this.examState.currentIndex] = base64;
                        status.textContent = '录音已保存';
                    });
                }
                btn.textContent = '🎤 开始录音';
                status.classList.remove('recording');
            });
        } else {
            Recorder.start().then(success => {
                if (success) {
                    btn.textContent = '⏹ 停止录音';
                    status.textContent = '录音中...';
                    status.classList.add('recording');
                }
            });
        }
    },

    startTimer() {
        const display = document.getElementById('timer-display');

        const updateTimer = () => {
            const minutes = Math.floor(this.examState.remainingTime / 60);
            const seconds = this.examState.remainingTime % 60;
            display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            if (this.examState.remainingTime <= 0) {
                clearInterval(this.examState.timerInterval);
                this.submitExam(true);
            }
        };

        updateTimer();
        this.examState.timerInterval = setInterval(() => {
            this.examState.remainingTime--;
            updateTimer();
        }, 1000);
    },

    submitExam(autoSubmit = false) {
        clearInterval(this.examState.timerInterval);
        this.saveCurrentAnswer();

        const usedTime = Math.floor((Date.now() - this.examState.startTime) / 1000);
        const minutes = Math.floor(usedTime / 60);
        const seconds = usedTime % 60;

        if (!autoSubmit && !confirm(`答题用时: ${minutes}分${seconds}秒，确认提交吗？`)) {
            this.examState.timerInterval = setInterval(() => {
                this.examState.remainingTime--;
                const display = document.getElementById('timer-display');
                const minutes = Math.floor(this.examState.remainingTime / 60);
                const seconds = this.examState.remainingTime % 60;
                display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                if (this.examState.remainingTime <= 0) {
                    clearInterval(this.examState.timerInterval);
                    this.submitExam(true);
                }
            }, 1000);
            return;
        }

        const record = {
            id: Date.now().toString(),
            date: new Date().toLocaleString('zh-CN'),
            questions: this.examState.questions,
            answers: this.examState.answers,
            recordings: this.examState.recordings,
            usedTime: usedTime
        };

        Storage.addRecord(record);
        alert('提交成功！');

        this.examState.isActive = false;
        this.renderRecordsList();
        this.loadPage('records');
    },

    // ========== 答题记录 ==========

    renderRecordsList() {
        const records = Storage.getRecords();
        const list = document.getElementById('records-list');

        if (records.length === 0) {
            list.innerHTML = '<p class="empty">暂无答题记录</p>';
            return;
        }

        list.innerHTML = records.map(r => `
            <div class="record-item" data-id="${r.id}">
                <div class="record-header">
                    <strong>${r.date}</strong>
                    <span>用时: ${Math.floor(r.usedTime / 60)}分${r.usedTime % 60}秒</span>
                </div>
                <div class="record-questions">
                    ${r.questions.map((q, i) => `
                        <div class="record-question">
                            <p><strong>Q${i+1}:</strong> ${this.escapeHtml(q.substring(0, 80))}${q.length > 80 ? '...' : ''}</p>
                            <p class="answer">A: ${this.escapeHtml(r.answers[i]?.substring(0, 150) || '(未填写)')}${r.answers[i]?.length > 150 ? '...' : ''}</p>
                            ${r.recordings[i] ? `<button class="btn btn-sm" onclick="App.playRecording('${r.id}', ${i})">🎵 播放录音</button>` : ''}
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-sm danger" onclick="App.deleteRecord('${r.id}')">删除</button>
            </div>
        `).join('');
    },

    playRecording(recordId, index) {
        const records = Storage.getRecords();
        const record = records.find(r => r.id === recordId);
        if (record && record.recordings[index]) {
            Recorder.play(record.recordings[index]);
        }
    },

    deleteRecord(id) {
        if (confirm('确定删除这条记录吗？')) {
            Storage.deleteRecord(id);
            this.renderRecordsList();
        }
    },

    clearRecords() {
        if (confirm('确定清空所有答题记录吗？此操作不可恢复！')) {
            Storage.clearRecords();
            this.renderRecordsList();
        }
    },

    // ========== 设置 ==========

    loadSettings() {
        const settings = Storage.getSettings();
        document.getElementById('default-count').value = settings.count;
        document.getElementById('default-timer').value = settings.timer;
    },

    saveSettings() {
        const count = parseInt(document.getElementById('default-count').value);
        const timer = parseInt(document.getElementById('default-timer').value);

        if (count < 1 || count > 10 || timer < 5 || timer > 60) {
            alert('请设置合理的参数：题数1-10，时间5-60分钟');
            return;
        }

        Storage.saveSettings({ count, timer });
        alert('设置已保存');
    },

    // ========== 工具 ==========

    hideModal(id) {
        document.getElementById(id).classList.remove('active');
        if (id === 'modal-import') {
            document.getElementById('import-preview').classList.add('hidden');
            delete document.getElementById('import-preview').dataset.questions;
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => App.init());
