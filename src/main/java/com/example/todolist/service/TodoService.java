package com.example.todolist.service;

import com.example.todolist.entity.TodoItem;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class TodoService {
    private final List<TodoItem> todoItems = new ArrayList<>();
    private final AtomicLong idCounter = new AtomicLong(1);

    //获取所有代办事项
    public List<TodoItem> getAllTodos() {
        return new ArrayList<>(todoItems);
    }

    //根据id查找待办事项
    public TodoItem getTodoById(Long id) {
        return todoItems.stream()
                .filter(todo -> todo.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    //添加新的待办事项
    public TodoItem addTodo(TodoItem todoItem) {
        todoItem.setId(idCounter.getAndIncrement());
        todoItems.add(todoItem);
        return todoItem;
    }

    //更新现有待办事项
    public TodoItem updateTodo(Long id, TodoItem updatedTodo) {
        TodoItem existingTodo = getTodoById(id);
        if (existingTodo != null) {
            existingTodo.setTitle(updatedTodo.getTitle());
            existingTodo.setDescription(updatedTodo.getDescription());
            existingTodo.setCompleted(updatedTodo.isCompleted());
            return existingTodo;
        }
        return null;
    }

    //切换任务完成状态
    public boolean toggleTodoStatus(Long id) {
        TodoItem todo = getTodoById(id);
        if (todo != null) {
            todo.setCompleted(!todo.isCompleted());
            return true;
        }
        return false;
    }

    //根据id删除待办事项
    public boolean deleteTodo(Long id) {
        return todoItems.removeIf(todo -> todo.getId().equals(id));
    }

    //获取总任务数量
    public long getTotalCount() {
        return todoItems.size();
    }

    //获取已完成任务数
    public long getCompletedCount() {
        return todoItems.stream().filter(TodoItem::isCompleted).count();
    }

    //获取问完成任务数
    public long getActiveCount() {
        return todoItems.stream().filter(todo -> !todo.isCompleted()).count();
    }
}
