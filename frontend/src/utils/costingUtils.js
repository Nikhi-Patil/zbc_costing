export const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export const generateFinancialYears = (
  startYear = 2026
) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  const currentFY =
    currentMonth >= 4
      ? `${currentYear}-${String(currentYear + 1).slice(-2)}`
      : `${currentYear - 1}-${String(currentYear).slice(-2)}`;

  const endYear =
    currentMonth >= 4
      ? currentYear + 1
      : currentYear;

  return Array.from(
    { length: endYear - startYear + 1 },
    (_, index) => {
      const year = startYear + index;
      const fy = `${year}-${String(year + 1).slice(-2)}`;

      return {
        value: fy,
        label: fy,
        selected: fy === currentFY,
      };
    }
  );
};