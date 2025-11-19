package com.example.todolist.controller;

import com.example.todolist.entity.TodoItem;
import com.example.todolist.service.TodoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/todos")
public class TodoController {
    @Autowired
    private TodoService todoService;

    //获取所有待办事项
    @GetMapping
    public ResponseEntity<List<TodoItem>> getAllTodos() {
        // 返回200 OK状态和任务列表
        return ResponseEntity.ok(todoService.getAllTodos());
    }

    //添加新的待办事项
    @PostMapping
    public ResponseEntity<?> addTodo(@RequestBody TodoItem todoItem) {
        // 验证标题不能为空
        if (todoItem.getTitle() == null || todoItem.getTitle().trim().isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "标题不能为空");
            return ResponseEntity.badRequest().body(error);  // 返回400错误
        }

        // 保存待办事项并返回成功响应
        TodoItem savedTodo = todoService.addTodo(todoItem);
        return ResponseEntity.ok(savedTodo);
    }

    //更新现有的待办事项
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTodo(@PathVariable Long id, @RequestBody TodoItem todoItem) {
        TodoItem updated = todoService.updateTodo(id, todoItem);
        if (updated != null) {
            return ResponseEntity.ok(updated);  // 返回更新后的任务
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("error", "待办事项不存在");
            return ResponseEntity.notFound().build();  // 返回404未找到
        }
    }

    //切换任务完成状态
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggleTodoStatus(@PathVariable Long id) {
        boolean success = todoService.toggleTodoStatus(id);
        if (success) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "状态更新成功");
            return ResponseEntity.ok(response);
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("error", "待办事项不存在");
            return ResponseEntity.notFound().build();
        }
    }

    //删除待办事项
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTodo(@PathVariable Long id) {
        boolean success = todoService.deleteTodo(id);
        if (success) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "删除成功");
            return ResponseEntity.ok(response);
        } else {
            Map<String, String> error = new HashMap<>();
            error.put("error", "待办事项不存在");
            return ResponseEntity.notFound().build();
        }
    }

    //获取任务统计信息
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("total", todoService.getTotalCount());        // 总任务数
        stats.put("completed", todoService.getCompletedCount()); // 已完成数
        stats.put("active", todoService.getActiveCount());      // 未完成数
        return ResponseEntity.ok(stats);
    }

}
