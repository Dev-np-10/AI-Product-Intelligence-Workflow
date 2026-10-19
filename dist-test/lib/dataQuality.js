export function computeDataQuality(rows, parseErrors, missingRequiredColumns) {
    const issues = [...parseErrors];
    missingRequiredColumns.forEach((col) => {
        issues.unshift({
            row: 0,
            type: 'missing_column',
            message: `Required column "${col}" is missing from the CSV header.`,
        });
    });
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let earliest = null;
    let latest = null;
    rows.forEach((r) => {
        ratingBreakdown[r.rating] = (ratingBreakdown[r.rating] ?? 0) + 1;
        if (!earliest || r.date < earliest)
            earliest = r.date;
        if (!latest || r.date > latest)
            latest = r.date;
    });
    const duplicateRows = issues.filter((i) => i.type === 'duplicate').length;
    const malformedDates = issues.filter((i) => i.type === 'malformed_date').length;
    const missingRequired = issues.filter((i) => i.type === 'missing_required').length;
    const invalidRatings = issues.filter((i) => i.type === 'invalid_rating').length;
    return {
        totalRows: rows.length + parseErrors.filter((e) => e.type !== 'duplicate').length,
        validRows: rows.length,
        duplicateRows,
        malformedDates,
        missingRequired,
        invalidRatings,
        ratingBreakdown,
        dateRange: { earliest, latest },
        issues,
    };
}
export function isDatasetEmpty(report) {
    return report.validRows === 0;
}
