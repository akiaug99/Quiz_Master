// js/storage.js - 本地存储模块
const Storage = {
    KEYS: {
        QUESTIONS: 'exam_questions',
        SETTINGS: 'exam_settings',
        RECORDS: 'exam_records'
    },

    // 获取题库
    getQuestions() {
        const data = localStorage.getItem(this.KEYS.QUESTIONS);
        return data ? JSON.parse(data) : [];
    },

    // 保存题库
    saveQuestions(questions) {
        localStorage.setItem(this.KEYS.QUESTIONS, JSON.stringify(questions));
    },

    // 添加题目
    addQuestion(question) {
        const questions = this.getQuestions();
        questions.push(question);
        this.saveQuestions(questions);
    },

    // 删除题目
    deleteQuestion(index) {
        const questions = this.getQuestions();
        questions.splice(index, 1);
        this.saveQuestions(questions);
    },

    // 编辑题目
    editQuestion(index, newContent) {
        const questions = this.getQuestions();
        questions[index] = newContent;
        this.saveQuestions(questions);
    },

    // 清空题库
    clearQuestions() {
        localStorage.removeItem(this.KEYS.QUESTIONS);
    },

    // 获取设置
    getSettings() {
        const data = localStorage.getItem(this.KEYS.SETTINGS);
        return data ? JSON.parse(data) : { count: 5, timer: 20 };
    },

    // 保存设置
    saveSettings(settings) {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    },

    // 获取答题记录
    getRecords() {
        const data = localStorage.getItem(this.KEYS.RECORDS);
        return data ? JSON.parse(data) : [];
    },

    // 保存答题记录
    saveRecords(records) {
        localStorage.setItem(this.KEYS.RECORDS, JSON.stringify(records));
    },

    // 添加答题记录
    addRecord(record) {
        const records = this.getRecords();
        records.unshift(record);
        this.saveRecords(records);
    },

    // 删除单条记录
    deleteRecord(id) {
        const records = this.getRecords();
        const index = records.findIndex(r => r.id === id);
        if (index > -1) {
            records.splice(index, 1);
            this.saveRecords(records);
        }
    },

    // 清空记录
    clearRecords() {
        localStorage.removeItem(this.KEYS.RECORDS);
    },

    // 导出题库为JSON
    exportQuestions() {
        const questions = this.getQuestions();
        return JSON.stringify(questions, null, 2);
    },

    // 随机抽题
    getRandomQuestions(count) {
        const questions = this.getQuestions();
        const shuffled = [...questions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(count, questions.length));
    }
};
