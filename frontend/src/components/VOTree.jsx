import { useState, useEffect } from 'react'
import { api } from '../api.js'

// Renders a single tree node and its children recursively
// connectors: array of booleans — true = draw vertical line at that depth level
function TreeNode({ node, selectedIds, onSelect, multiSelect, expandedIds, onToggle, isLast = false, connectors = [] }) {
  const isExpanded = expandedIds.has(node.vo_id)
  const isSelected = selectedIds.includes(node.vo_id)
  const hasChildren = node.children && node.children.length > 0
  const isClickable = node.has_data
  const depth = connectors.length

  function handleToggle(e) {
    e.stopPropagation()
    onToggle(node.vo_id)
  }

  function handleSelect() {
    if (!isClickable) return
    onSelect(node.vo_id)
  }

  return (
    <div>
      <div
        className={`flex items-center py-px px-1 group cursor-default select-none
          ${isSelected ? 'bg-teal-100' : 'hover:bg-gray-100'}
        `}
      >
        {/* Tree connector lines */}
        {connectors.map((showLine, i) => (
          <span
            key={i}
            className="flex-shrink-0 inline-block"
            style={{ width: 16, height: 20, position: 'relative' }}
          >
            {showLine && (
              <span
                className="absolute left-[7px] top-0 bottom-0 border-l border-gray-300"
                style={{ width: 0 }}
              />
            )}
          </span>
        ))}

        {/* Current node connector: L-bend for last child, T-bend for others */}
        {depth > 0 && (
          <span
            className="flex-shrink-0 inline-block"
            style={{ width: 16, height: 20, position: 'relative' }}
          >
            {/* Vertical line — full height for non-last, half for last */}
            <span
              className="absolute left-[7px] top-0 border-l border-gray-300"
              style={{ height: isLast ? 10 : 20, width: 0 }}
            />
            {/* Horizontal branch */}
            <span
              className="absolute top-[10px] left-[7px] border-t border-gray-300"
              style={{ width: 8, height: 0 }}
            />
          </span>
        )}

        {/* Expand/collapse arrow */}
        <button
          className={`flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600
            ${hasChildren ? '' : 'invisible'}
          `}
          onClick={handleToggle}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          tabIndex={hasChildren ? 0 : -1}
        >
          <svg
            className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Checkbox for multi-select */}
        {multiSelect && isClickable && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            className="flex-shrink-0 w-3.5 h-3.5 accent-teal-600 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {/* Node label */}
        <button
          className={`flex-1 text-left text-xs leading-snug truncate ml-0.5
            ${isClickable
              ? isSelected
                ? 'text-teal-800 font-semibold'
                : 'text-teal-700 hover:text-teal-900 cursor-pointer'
              : 'text-gray-400 cursor-default'
            }
          `}
          onClick={handleSelect}
          title={`${node.name} (${node.vo_id})`}
          disabled={!isClickable}
        >
          {node.name}
        </button>

        {/* VO ID on hover */}
        <span className="flex-shrink-0 text-[10px] text-gray-400 ml-1 hidden group-hover:inline">
          {node.vo_id.replace('VO_', '')}
        </span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child, idx) => (
            <TreeNode
              key={child.vo_id}
              node={child}
              selectedIds={selectedIds}
              onSelect={onSelect}
              multiSelect={multiSelect}
              expandedIds={expandedIds}
              onToggle={onToggle}
              isLast={idx === node.children.length - 1}
              connectors={[...connectors, !isLast]}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Recursively collect all vo_ids from the tree data
function collectAllVoIds(nodes) {
  const ids = []
  function walk(nodeList) {
    for (const node of nodeList) {
      ids.push(node.vo_id)
      if (node.children && node.children.length > 0) {
        walk(node.children)
      }
    }
  }
  walk(nodes)
  return ids
}

export default function VOTree({ onSelect, selectedIds = [], multiSelect = false }) {
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [dataOnly, setDataOnly] = useState(true)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.vaccineHierarchy(10, dataOnly)
      .then((data) => {
        setTree(data.tree || [])
        // Expand level-1 nodes by default
        const level1Ids = (data.tree || []).map((n) => n.vo_id)
        setExpandedIds(new Set(level1Ids))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [dataOnly])

  function handleToggle(voId) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(voId)) {
        next.delete(voId)
      } else {
        next.add(voId)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400 text-xs">
        <svg className="animate-spin w-4 h-4 mr-2 text-teal-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading hierarchy...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-xs p-2">
        Failed to load hierarchy: {error}
      </div>
    )
  }

  if (tree.length === 0) {
    return (
      <div className="text-gray-400 text-xs p-2">No hierarchy data available.</div>
    )
  }

  function handleExpandAll() {
    setExpandedIds(new Set(collectAllVoIds(tree)))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tree controls */}
      <div className="flex-shrink-0 px-2 py-1 border-b border-gray-100 flex items-center gap-3">
        <button
          onClick={handleExpandAll}
          className="text-[10px] text-teal-600 hover:text-teal-800 hover:underline"
        >
          Expand All
        </button>
        <label className="flex items-center gap-1 text-[10px] text-gray-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!dataOnly}
            onChange={() => setDataOnly((v) => !v)}
            className="w-3 h-3 accent-teal-600"
          />
          Show all VO terms
        </label>
      </div>
      <div
        className="flex-1 overflow-y-auto text-sm"
      >
        {tree.map((node, idx) => (
          <TreeNode
            key={node.vo_id}
            node={node}
            selectedIds={selectedIds}
            onSelect={onSelect}
            multiSelect={multiSelect}
            expandedIds={expandedIds}
            onToggle={handleToggle}
            isLast={idx === tree.length - 1}
            connectors={[]}
          />
        ))}
      </div>
    </div>
  )
}
