# CRITICAL FIX for Data Synchronization Issue
# The problem: Admin and User APIs query different datasets

# CURRENT PROBLEMATIC CODE in server.py lines 1274-1277:
@api_router.get("/admin/tasks")
async def admin_get_all_tasks(admin_user = Depends(require_admin)):
    tasks = await db.tasks.find().sort("created_at", -1).to_list(1000)  # Gets ALL tasks
    return [serialize_doc(task) for task in tasks]

# VS User tasks endpoint lines 1114-1117:
@api_router.get("/tasks")
async def get_all_tasks():
    tasks = await db.tasks.find({"active": True}).sort("competency_area", 1).sort("sub_competency", 1).sort("order", 1).to_list(1000)  # Gets ONLY active tasks
    return [serialize_doc(task) for task in tasks]

# SOLUTION 1: Make admin endpoint consistent with user endpoint (RECOMMENDED)
@api_router.get("/admin/tasks")
async def admin_get_all_tasks(admin_user = Depends(require_admin)):
    # OPTION A: Show only active tasks (same as user view)
    tasks = await db.tasks.find({"active": True}).sort("created_at", -1).to_list(1000)
    return [serialize_doc(task) for task in tasks]
    
    # OPTION B: Add flag to control visibility
    # include_inactive = request.query_params.get("include_inactive", "false") == "true"
    # query = {} if include_inactive else {"active": True}
    # tasks = await db.tasks.find(query).sort("created_at", -1).to_list(1000)
    # return [serialize_doc(task) for task in tasks]

# SOLUTION 2: Ensure task creation always sets active: True (VERIFICATION)
@api_router.post("/admin/tasks", response_model=Task)
async def admin_create_task(task_data: TaskCreate, admin_user = Depends(require_admin)):
    # Create task with explicit active: True
    task_dict = task_data.dict()
    task_dict["active"] = True  # EXPLICIT SETTING
    task = Task(**task_dict, created_by=admin_user.get("sub", "admin"))
    await db.tasks.insert_one(task.dict())
    return task

# SOLUTION 3: Debugging endpoint to check task states
@api_router.get("/admin/debug/tasks")
async def debug_task_states(admin_user = Depends(require_admin)):
    all_tasks = await db.tasks.find().to_list(1000)
    active_tasks = await db.tasks.find({"active": True}).to_list(1000)
    
    return {
        "total_tasks": len(all_tasks),
        "active_tasks": len(active_tasks),
        "inactive_tasks": len(all_tasks) - len(active_tasks),
        "recent_tasks": [
            {
                "id": task.get("id"),
                "title": task.get("title"),
                "active": task.get("active"),
                "created_at": task.get("created_at")
            }
            for task in sorted(all_tasks, key=lambda x: x.get("created_at", ""), reverse=True)[:5]
        ]
    }