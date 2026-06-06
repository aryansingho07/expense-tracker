export function todayString() {
  return formatDate(new Date());
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDateRange(preset, customRange) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  if (preset === "thisMonth") {
    return {
      from: formatDate(new Date(currentYear, currentMonth, 1)),
      to: todayString()
    };
  }

  if (preset === "lastMonth") {
    return {
      from: formatDate(new Date(currentYear, currentMonth - 1, 1)),
      to: formatDate(new Date(currentYear, currentMonth, 0))
    };
  }

  if (preset === "custom") {
    return {
      from: customRange.from,
      to: customRange.to
    };
  }

  return { from: "", to: "" };
}
