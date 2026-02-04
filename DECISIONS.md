# Decisions

## 1. Why MobX?

I've used Redux on bigger projects and it works well, but for something this size it felt like overkill. MobX lets me mutate state directly and everything updates. No actions, no reducers, no middleware setup.

The task counts were a good example - computed values just work. In Redux I'd be writing selectors and probably pulling in reselect.

## 2. Folder Structure

```
src/
├── api/
├── components/
├── pages/
├── stores/
├── styles/
├── types/
```

Nothing clever. API layer keeps axios calls out of components which I've learned matters when you inevitably need to swap http clients or add interceptors. Thought about feature folders (projects/, tasks/) but with only 2 entities it felt like I was just creating folders for the sake of it.

## 3. Tradeoff

The task counts situation was tricky. Stats bar needs to show totals for all statuses even when filtering the table. Initially had the frontend making two API calls which felt wasteful.

Ended up using Laravel's Concurrency to run both queries in parallel on the backend - the filtered/paginated list and a GROUP BY for counts. Single request, both results. The counts come back in the response alongside the paginated data.

Mobile responsiveness took more time than expected. Had to hide table columns progressively - due date goes first on tablet, then priority on mobile. The filter dropdowns were a pain to get right on small screens, ended up stacking them vertically below 576px.

## 4. Scaling

Pagination and search handle most realistic scenarios. If we're talking actual 100k+ tasks per project, I'd swap to cursor pagination (OFFSET gets slow on large datasets, learned that one the hard way) and add an index on the columns we filter/sort by.

Frontend would need virtualized rows. AntD has it built in, just didn't wire it up. Debouncing the search would help too.

That said, if a single project has 100k tasks thats more of a UX problem than a technical one. You'd want completely different navigation - faceted search, saved views, maybe a board layout.
