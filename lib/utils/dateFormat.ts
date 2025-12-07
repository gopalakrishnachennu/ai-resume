// Date formatting utility
export const formatMonthYear = (dateString: string): string => {
    if (!dateString) return '';

    // Handle YYYY-MM format
    const [year, month] = dateString.split('-');
    if (!year || !month) return dateString;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(month) - 1;

    return `${months[monthIndex]} ${year}`;
};

export const parseMonthYear = (formattedDate: string): string => {
    if (!formattedDate) return '';

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const parts = formattedDate.split(' ');

    if (parts.length !== 2) return '';

    const monthIndex = months.indexOf(parts[0]);
    if (monthIndex === -1) return '';

    const month = String(monthIndex + 1).padStart(2, '0');
    return `${parts[1]}-${month}`;
};
