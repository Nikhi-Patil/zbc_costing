Optimized components

Behavior preserved:
- Same API endpoints
- Same request payload field names
- Same validation rules
- Same Excel templates and upload flow
- Same report grouping keys and displayed fields
- Same UI actions and callbacks

Optimizations:
- Removed unused BOP bulk-upload constant.
- Memoized derived report/grouping data so it is not rebuilt on unrelated renders.
- Memoized compound polymer/filter lists and unit map.
- Kept existing functionality and data flow unchanged.
