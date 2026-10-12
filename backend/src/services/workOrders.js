const activeStatuses = new Set(['Open', 'Scheduled', 'In Progress']);
const taskKey = (title) => title.trim().replace(/\s+/g, ' ').toLowerCase();

export function findDuplicateActiveOrder(orders, machineId, title) {
  return orders.find((order) => order.machineId === machineId &&
    activeStatuses.has(order.status) && taskKey(order.title) === taskKey(title));
}

export function nextWorkOrderId(orders) {
  const numbers = orders.map((order) => /^WO-(\d+)$/.exec(order.id))
    .filter(Boolean).map((match) => Number(match[1]));
  return `WO-${Math.max(1048, ...numbers) + 1}`;
}
