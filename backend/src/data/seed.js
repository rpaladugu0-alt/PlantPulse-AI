export const seedMachines = [
  {
    id: "M-101", name: "Hydraulic Press 4", line: "Assembly A", type: "Press",
    status: "critical", health: 38, temperature: 91, vibration: 8.7, pressure: 146,
    lastService: "2026-08-18", runtimeHours: 1842,
    history: [62, 61, 59, 55, 53, 49, 46, 43, 41, 38]
  },
  {
    id: "M-204", name: "Conveyor Motor 2", line: "Packaging", type: "Motor",
    status: "warning", health: 67, temperature: 74, vibration: 5.2, pressure: 100,
    lastService: "2026-09-02", runtimeHours: 1033,
    history: [79, 78, 77, 75, 73, 72, 70, 69, 68, 67]
  },
  {
    id: "M-309", name: "CNC Mill 7", line: "Machining", type: "CNC",
    status: "healthy", health: 92, temperature: 58, vibration: 2.1, pressure: 118,
    lastService: "2026-09-21", runtimeHours: 488,
    history: [94, 94, 93, 94, 93, 92, 93, 92, 92, 92]
  },
  {
    id: "M-412", name: "Air Compressor 1", line: "Utilities", type: "Compressor",
    status: "healthy", health: 86, temperature: 63, vibration: 2.9, pressure: 124,
    lastService: "2026-09-16", runtimeHours: 621,
    history: [90, 90, 89, 89, 88, 88, 87, 87, 86, 86]
  },
  {
    id: "M-518", name: "Robotic Welder 3", line: "Assembly B", type: "Robot",
    status: "warning", health: 71, temperature: 69, vibration: 4.8, pressure: 111,
    lastService: "2026-08-29", runtimeHours: 1217,
    history: [83, 82, 80, 79, 78, 76, 75, 73, 72, 71]
  },
  {
    id: "M-623", name: "Cooling Pump 5", line: "Utilities", type: "Pump",
    status: "healthy", health: 89, temperature: 54, vibration: 2.4, pressure: 116,
    lastService: "2026-09-25", runtimeHours: 377,
    history: [91, 92, 91, 91, 90, 90, 90, 89, 89, 89]
  }
];

export const seedWorkOrders = [
  { id: "WO-1048", machineId: "M-101", title: "Inspect hydraulic seals and bearing", priority: "high", status: "Open", assignee: "Maintenance Team A", createdAt: "2026-10-03T08:20:00.000Z" },
  { id: "WO-1047", machineId: "M-204", title: "Check motor alignment", priority: "medium", status: "Scheduled", assignee: "Jordan Lee", createdAt: "2026-10-02T14:05:00.000Z" },
  { id: "WO-1046", machineId: "M-518", title: "Inspect welding arm vibration", priority: "medium", status: "In Progress", assignee: "Casey Morgan", createdAt: "2026-10-01T16:40:00.000Z" }
];
