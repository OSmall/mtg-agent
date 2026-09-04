# SQL-backed Card Query repository

The SQLite `CardQueryRepository` uses a SQL-backed implementation while keeping the public Card Query tool shape stable.
Supported filtering, sorting, limiting, and Collection quantity aggregation are pushed into SQLite through a bounded
SQL compiler inside the SQLite adapter, with TypeScript assembling already-constrained rows into the result shape. This
deliberately uses adapter-local raw SQL fragments rather than forcing a dynamic expression tree through Drizzle's
fluent API. The durable public and compilation semantics are defined in
[`../card-query.md`](../card-query.md); accidental behavior from the superseded in-memory evaluator does not define the
contract.
