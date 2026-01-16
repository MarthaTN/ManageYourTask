/***********************
 * DOM ELEMENTS
 ***********************/
const taskTitleInput = document.getElementById("taskTitleInput");
const taskDeadlineInput = document.getElementById("taskDeadlineInput");

const addTaskBtn = document.getElementById("addTaskBtn");
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");

const taskContainer = document.getElementById("taskContainer");

/***********************
 * CLASSES
 ***********************/
class Task {
    constructor(title) {
        if (!title || title.trim().length < 3) {
            throw new Error("Task title must be at least 3 characters");
        }

        this.id = Date.now();
        this.title = title.trim();
        this.status = "pending";
        this.subtasks = [];
    }

    changeStatus(newStatus) {
        const allowed = ["pending", "done", "cancelled"];
        if (allowed.includes(newStatus)) {
            this.status = newStatus;
        }
    }

    addSubTask(subtask) {
        if (subtask instanceof Task) {
            this.subtasks.push(subtask);
        }
    }
}

class TimedTask extends Task {
    constructor(title, deadline) {
        super(title);

        if (!deadline) {
            throw new Error("TimedTask requires a deadline");
        }

        this.deadline = deadline;
    }
}

/***********************
 * STATE
 ***********************/
const state = {
    tasks: []
};

/***********************
 * STATE FUNCTIONS
 ***********************/
function addTask(task) {
    state.tasks.push(task);
}

function deleteTask(taskId) {
    state.tasks = state.tasks.filter(task => task.id !== taskId);
}

function changeTaskStatus(taskId, status) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        task.changeStatus(status);
    }
}

/***********************
 * RENDERING
 ***********************/
function renderTasks(container, tasks = state.tasks) {
    container.innerHTML = "";

    tasks.forEach(task => {
        const taskCard = document.createElement("div");
        taskCard.className = "task-card";

        const title = document.createElement("p");
        title.textContent = task.deadline
            ? `${task.title} (${task.status}) – Due: ${task.deadline}`
            : `${task.title} (${task.status})`;

        const doneBtn = document.createElement("button");
        doneBtn.textContent = "Done";
        doneBtn.onclick = () => {
            changeTaskStatus(task.id, "done");
            renderTasks(taskContainer);
        };

        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.onclick = () => {
            changeTaskStatus(task.id, "cancelled");
            renderTasks(taskContainer);
        };

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () => {
            deleteTask(task.id);
            renderTasks(taskContainer);
        };

        taskCard.append(title, doneBtn, cancelBtn, deleteBtn);

        /* SUBTASKS */
        if (task.subtasks.length > 0) {
            const subContainer = document.createElement("div");
            subContainer.className = "subtasks";
            renderTasks(subContainer, task.subtasks);
            taskCard.appendChild(subContainer);
        }

        container.appendChild(taskCard);
    });
}

/***********************
 * EVENTS
 ***********************/
addTaskBtn.addEventListener("click", () => {
    const title = taskTitleInput.value.trim();
    if (!title) return;

    let task;

    try {
        if (taskDeadlineInput.value) {
            task = new TimedTask(title, taskDeadlineInput.value);
        } else {
            task = new Task(title);
        }

        addTask(task);
        renderTasks(taskContainer);

        taskTitleInput.value = "";
        taskDeadlineInput.value = "";
    } catch (err) {
        alert(err.message); // ✅ Shows message if title < 3 chars
    }
});


/***********************
 * SAVE & LOAD
 ***********************/
saveBtn.addEventListener("click", () => {
    localStorage.setItem("tasks", JSON.stringify(state.tasks));
    alert("Tasks saved!");
});

function rebuildTask(data) {
    let task;

    if (data.deadline) {
        task = new TimedTask(data.title, data.deadline);
    } else {
        task = new Task(data.title);
    }

    task.id = data.id;
    task.status = data.status;

    if (data.subtasks && data.subtasks.length) {
        data.subtasks.forEach(sub => {
            task.addSubTask(rebuildTask(sub));
        });
    }

    return task;
}

loadBtn.addEventListener("click", () => {
    const data = JSON.parse(localStorage.getItem("tasks")) || [];
    state.tasks = data.map(rebuildTask);
    renderTasks(taskContainer);
});
