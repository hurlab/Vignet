import { useState, useEffect } from 'react'
import { api } from '../api.js'

// Renders a single tree node and its children recursively
function TreeNode({ node, selectedIds, onSelect, multiSelect, expandedIds, onToggle }) {
  const isExpanded = expandedIds.has(node.vo_id)
  const isSelected = selectedIds.includes(node.vo_id)
  const hasChildren = node.children && node.children.length > 0
  const isClickable = node.has_data

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
        className={`flex items-center gap-1 py-0.5 px-1 rounded group cursor-default select-none
          ${isSelected ? 'bg-teal-100' : 'hover:bg-gray-100'}
        `}
        style={{ paddingLeft: `${(node.level - 1) * 12 + 4}px` }}
      >
        {/* Expand/collapse arrow */}
        <button
          className={`flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-transform
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
          className={`flex-1 text-left text-xs leading-snug truncate
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

        {/* VO ID in small gray text */}
        <span className="flex-shrink-0 text-[10px] text-gray-400 ml-1 hidden group-hover:inline">
          {node.vo_id.replace('VO_', '')}
        </span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.vo_id}
              node={child}
              selectedIds={selectedIds}
              onSelect={onSelect}
              multiSelect={multiSelect}
              expandedIds={expandedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function VOTree({ onSelect, selectedIds = [], multiSelect = false }) {
  const [tree, setTree] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedIds, setExpandedIds] = useState(new Set())

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.vaccineHierarchy()
      .then((data) => {
        setTree(data.tree || [])
        // Expand level-1 nodes by default
        const level1Ids = (data.tree || []).map((n) => n.vo_id)
        setExpandedIds(new Set(level1Ids))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

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

  return (
    <div
      className="overflow-y-auto text-sm"
      style={{ maxHeight: '100%' }}
    >
      {tree.map((node) => (
        <TreeNode
          key={node.vo_id}
          node={node}
          selectedIds={selectedIds}
          onSelect={onSelect}
          multiSelect={multiSelect}
          expandedIds={expandedIds}
          onToggle={handleToggle}
        />
      ))}
    </div>
  )
}
