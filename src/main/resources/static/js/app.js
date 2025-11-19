// app.js
// TODO List 应用主逻辑类
class TodoApp {
    /**
     * 构造函数，初始化应用
     */
    constructor() {
        this.baseUrl = '/api/todos';  // API基础URL
        this.currentFilter = 'all';   // 当前筛选条件，默认显示全部
        this.init();  // 初始化应用
    }

    /**
     * 初始化应用
     * 绑定事件监听器并加载初始数据
     */
    init() {
        this.bindEvents();    // 绑定DOM事件
        this.loadTodos();     // 加载任务列表
        this.loadStats();     // 加载统计信息
    }

    /**
     * 绑定所有DOM事件监听器
     */
    bindEvents() {
        // 表单提交事件 - 添加新任务
        document.getElementById('addTodoForm').addEventListener('submit', (e) => {
            e.preventDefault();  // 阻止表单默认提交行为
            this.addTodo();
        });

        // 筛选按钮点击事件
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // 标题输入框实时验证
        document.getElementById('title').addEventListener('input', (e) => {
            this.validateTitle(e.target.value);
        });
    }

    /**
     * 设置当前筛选条件
     * @param {string} filter - 筛选条件：'all', 'active', 'completed'
     */
    setFilter(filter) {
        this.currentFilter = filter;

        // 更新筛选按钮的激活状态
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.classList.remove('active');  // 移除所有激活状态
        });
        // 设置当前筛选按钮为激活状态
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        // 重新加载并渲染任务列表
        this.loadTodos();
    }

    /**
     * 从服务器加载任务列表
     */
    async loadTodos() {
        try {
            // 发送GET请求获取任务列表
            const response = await fetch(this.baseUrl);
            const todos = await response.json();  // 解析JSON响应

            this.renderTodos(todos);  // 渲染任务列表
            this.toggleEmptyState(todos.length === 0);  // 切换空状态显示
        } catch (error) {
            // 错误处理
            this.showAlert('加载任务列表失败', 'danger');
            console.error('Error loading todos:', error);
        }
    }

    /**
     * 加载统计信息
     */
    async loadStats() {
        try {
            const response = await fetch(`${this.baseUrl}/stats`);
            const stats = await response.json();
            this.renderStats(stats);  // 渲染统计信息
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    /**
     * 渲染统计信息到页面
     * @param {Object} stats - 统计信息对象
     */
    renderStats(stats) {
        document.getElementById('totalCount').textContent = stats.total;
        document.getElementById('activeCount').textContent = stats.active;
        document.getElementById('completedCount').textContent = stats.completed;
    }

    /**
     * 渲染任务列表到页面
     * @param {Array} todos - 任务数组
     */
    renderTodos(todos) {
        const todoList = document.getElementById('todoList');
        todoList.innerHTML = '';  // 清空当前列表

        // 根据当前筛选条件过滤任务
        const filteredTodos = this.filterTodos(todos);

        // 为每个任务创建DOM元素并添加到列表
        filteredTodos.forEach(todo => {
            const todoElement = this.createTodoElement(todo);
            todoList.appendChild(todoElement);
        });
    }

    /**
     * 根据当前筛选条件过滤任务
     * @param {Array} todos - 原始任务数组
     * @returns {Array} 过滤后的任务数组
     */
    filterTodos(todos) {
        switch (this.currentFilter) {
            case 'active':
                return todos.filter(todo => !todo.completed);  // 未完成任务
            case 'completed':
                return todos.filter(todo => todo.completed);   // 已完成任务
            default:
                return todos;  // 全部任务
        }
    }

    /**
     * 创建单个任务项的DOM元素
     * @param {Object} todo - 任务对象
     * @returns {HTMLElement} 任务项的DOM元素
     */
    createTodoElement(todo) {
        const li = document.createElement('li');
        // 设置CSS类，已完成的任务添加completed类
        li.className = `list-group-item todo-item ${todo.completed ? 'completed' : ''}`;

        // 任务项的HTML结构
        li.innerHTML = `
            <div class="d-flex align-items-center">
                <!-- 完成状态复选框 -->
                <div class="form-check me-3 flex-shrink-0">
                    <input class="form-check-input" type="checkbox" 
                           ${todo.completed ? 'checked' : ''} 
                           data-id="${todo.id}"
                           style="width: 1.2em; height: 1.2em; cursor: pointer;">
                </div>
                <!-- 任务内容 -->
                <div class="flex-grow-1">
                    <div class="todo-title fw-semibold">${this.escapeHtml(todo.title)}</div>
                    ${todo.description ?
            `<div class="todo-description text-muted small mt-1">${this.escapeHtml(todo.description)}</div>`
            : ''}
                    <div class="text-muted small mt-1">
                        <i class="fas fa-clock me-1"></i>
                        ${this.formatDate(todo.createdAt)}
                    </div>
                </div>
                <!-- 操作按钮 -->
                <div class="todo-actions ms-3 flex-shrink-0">
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${todo.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        // 绑定复选框点击事件 - 切换完成状态
        const checkbox = li.querySelector('.form-check-input');
        checkbox.addEventListener('change', () => this.toggleTodoStatus(todo.id));

        // 绑定删除按钮点击事件
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));

        return li;
    }

    /**
     * 添加新任务
     */
    async addTodo() {
        const titleInput = document.getElementById('title');
        const descriptionInput = document.getElementById('description');

        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();

        // 验证标题
        if (!this.validateTitle(title)) {
            return;  // 验证失败，停止执行
        }

        try {
            // 发送POST请求创建新任务
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',  // 设置JSON内容类型
                },
                body: JSON.stringify({  // 将对象转换为JSON字符串
                    title: title,
                    description: description
                })
            });

            const result = await response.json();

            if (response.ok) {
                // 清空表单
                titleInput.value = '';
                descriptionInput.value = '';
                titleInput.classList.remove('is-valid');

                this.showAlert('任务添加成功', 'success');
                this.loadTodos();   // 重新加载任务列表
                this.loadStats();   // 更新统计信息
            } else {
                // 显示服务器返回的错误信息
                this.showAlert(result.error || '添加任务失败', 'danger');
            }
        } catch (error) {
            this.showAlert('网络错误，请重试', 'danger');
            console.error('Error adding todo:', error);
        }
    }

    /**
     * 切换任务的完成状态
     * @param {number} id - 任务ID
     */
    async toggleTodoStatus(id) {
        try {
            const response = await fetch(`${this.baseUrl}/${id}/toggle`, {
                method: 'PATCH'  // 使用PATCH进行部分更新
            });

            if (response.ok) {
                this.loadTodos();   // 重新加载列表
                this.loadStats();   // 更新统计
            } else {
                this.showAlert('状态更新失败', 'danger');
            }
        } catch (error) {
            this.showAlert('网络错误，请重试', 'danger');
            console.error('Error toggling todo:', error);
        }
    }

    /**
     * 删除任务
     * @param {number} id - 要删除的任务ID
     */
    async deleteTodo(id) {
        // 确认删除对话框
        if (!confirm('确定要删除这个任务吗？')) {
            return;  // 用户取消删除
        }

        try {
            const response = await fetch(`${this.baseUrl}/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showAlert('任务删除成功', 'success');
                this.loadTodos();   // 重新加载列表
                this.loadStats();   // 更新统计
            } else {
                this.showAlert('删除失败', 'danger');
            }
        } catch (error) {
            this.showAlert('网络错误，请重试', 'danger');
            console.error('Error deleting todo:', error);
        }
    }

    /**
     * 验证任务标题
     * @param {string} title - 要验证的标题
     * @returns {boolean} 验证是否通过
     */
    validateTitle(title) {
        const titleInput = document.getElementById('title');
        const errorElement = document.getElementById('titleError');

        if (!title) {
            // 标题为空
            titleInput.classList.add('is-invalid');
            titleInput.classList.remove('is-valid');
            errorElement.textContent = '标题不能为空';
            return false;
        } else if (title.length > 100) {
            // 标题过长
            titleInput.classList.add('is-invalid');
            titleInput.classList.remove('is-valid');
            errorElement.textContent = '标题不能超过100个字符';
            return false;
        } else {
            // 验证通过
            titleInput.classList.remove('is-invalid');
            titleInput.classList.add('is-valid');
            errorElement.textContent = '';
            return true;
        }
    }

    /**
     * 切换空状态显示
     * @param {boolean} isEmpty - 是否为空状态
     */
    toggleEmptyState(isEmpty) {
        const emptyState = document.getElementById('emptyState');
        const todoList = document.getElementById('todoList');

        if (isEmpty) {
            // 显示空状态提示
            emptyState.classList.remove('d-none');
            todoList.classList.add('d-none');
        } else {
            // 显示任务列表
            emptyState.classList.add('d-none');
            todoList.classList.remove('d-none');
        }
    }

    /**
     * 显示提示消息
     * @param {string} message - 要显示的消息
     * @param {string} type - 消息类型：'success', 'danger', 'warning', 'info'
     */
    showAlert(message, type) {
        const alertContainer = document.getElementById('alertContainer');
        const alertId = 'alert-' + Date.now();  // 生成唯一ID

        // 创建提示框HTML
        const alertHtml = `
            <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        // 添加到容器
        alertContainer.insertAdjacentHTML('beforeend', alertHtml);

        // 3秒后自动消失
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                alert.remove();  // 移除提示框
            }
        }, 3000);
    }

    /**
     * HTML转义，防止XSS攻击
     * @param {string} unsafe - 未转义的字符串
     * @returns {string} 转义后的字符串
     */
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * 格式化日期显示
     * @param {string} dateString - ISO日期字符串
     * @returns {string} 格式化后的日期字符串
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now - date;
        const diffInHours = diffInMs / (1000 * 60 * 60);

        // 相对时间显示
        if (diffInHours < 1) {
            return '刚刚';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}小时前`;
        } else {
            // 超过24小时显示具体日期
            return date.toLocaleDateString('zh-CN');
        }
    }
}

// 应用初始化：当DOM加载完成后创建TodoApp实例
document.addEventListener('DOMContentLoaded', function() {
    new TodoApp();
});