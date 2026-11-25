-- ════════════════════════════════════════════════════════════════
-- RAG (retrieval-augmented generation) storage.
-- Every searchable text ("chunk") is stored here together with its
-- embedding: 768 numbers that describe what the text MEANS.
-- Safe to run again and again (everything is IF NOT EXISTS).
-- ════════════════════════════════════════════════════════════════

-- 1) Turn on pgvector: adds the "vector" column type and
--    "closest meaning" search. Free on every Neon plan.
CREATE EXTENSION IF NOT EXISTS vector;

-- 2) The table of searchable texts
CREATE TABLE IF NOT EXISTS rag_chunks (
    id SERIAL PRIMARY KEY,

    -- What kind of text: 'product' = one product,
    -- 'knowledge' = one "## section" of a shop info page
    source_type VARCHAR(20) NOT NULL
        CHECK (source_type IN ('product', 'knowledge')),

    -- Unique name of the text, e.g. 'product:5' or 'shipping.md#2'
    source_key TEXT NOT NULL UNIQUE,

    -- Link to the product. ON DELETE CASCADE: deleting a product
    -- automatically deletes its searchable text too.
    product_id INTEGER
        REFERENCES products(id)
        ON DELETE CASCADE,

    -- The text itself
    title TEXT NOT NULL,
    content TEXT NOT NULL,

    -- Fingerprint of title + content + model. If it hasn't changed,
    -- the text is NOT sent to Google again (saves your free quota).
    content_hash TEXT NOT NULL,

    -- The meaning vector (768 numbers from Gemini)
    embedding vector(768) NOT NULL,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3) Search index: makes "find the closest meaning" fast
--    (HNSW index, comparing vectors by cosine distance)
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding
ON rag_chunks USING hnsw (embedding vector_cosine_ops);
