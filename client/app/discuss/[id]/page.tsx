'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { authFetch, getCachedUser, setCachedUser } from '../../utils/auth'
import { User, ForumPost } from '../../types'

interface Comment {
  id: string
  authorName: string
  content: string
  createdAt: string
  parentId: string | null
  repliedToName?: string | null
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '.')
}

function formatCommentDate(dateStr: string) {
  if (!dateStr) return 'Just now'
  if (dateStr === 'Just now' || dateStr === 'date') return dateStr

  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) {
      return dateStr
    }
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()

    if (diffMs < 10000) {
      return 'Just now'
    }

    const diffSecs = Math.floor(diffMs / 1000)
    if (diffSecs < 60) {
      return `${diffSecs}s ago`
    }

    const diffMins = Math.floor(diffSecs / 60)
    if (diffMins < 60) {
      return `${diffMins}m ago`
    }

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) {
      return `${diffHours}h ago`
    }

    return formatDate(dateStr)
  } catch (e) {
    return dateStr
  }
}

export default function ForumDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [user, setUser] = useState<User | null>(() => getCachedUser())
  const [post, setPost] = useState<ForumPost | null>(null)
  const [loading, setLoading] = useState(() => !getCachedUser())
  const [comments, setComments] = useState<Comment[]>([])
  const [inputValue, setInputValue] = useState('')
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const authRes = await authFetch('http://localhost:3001/api/auth/me')
        if (!authRes.ok) throw new Error('Not authorized')
        const authData = await authRes.json()
        setUser(authData.user)
        setCachedUser(authData.user)

        // Try to fetch post from backend, fallback to matching mock post
        const forumRes = await authFetch('http://localhost:3001/api/forums')
        let foundPost: ForumPost | null = null

        if (forumRes.ok) {
          const posts: ForumPost[] = await forumRes.json()
          const matched = posts.find(p => p.id === parseInt(id))
          if (matched) foundPost = matched
        }

        // If not found in backend API, use fallback mock post matching the overview and screenshot
        if (!foundPost) {
          foundPost = {
            id: parseInt(id) || 1,
            title: 'Long descriptive title of the forum',
            content: `Beginning of the Question/Forum Text ... Lorem Ipsum et Dolor Lorem Ipsum et Dolor Lorem Ipsum et Dolor Lorem Ipsum et Dolor
Lorem Ipsum et Dolor Lorem Ipsum et Dolor Lorem Ipsum et Dolor Lorem Ipsum et Dolor Lorem Ipsum et Dolor Lorem Ipsum et Dolor Lorem Ipsum et Dolor Lorem Ipsum et Dolor Lorem Ipsum et Dolor Lorem Ipsum et Dolor Lorem Ipsum et Dolor Lorem Ipsum et Dolor Lorem Ipsum et Dolor ...
Lorem Ipsum et Dolor Lorem Ipsum et Dolor Lorem Ipsum et Dolor Lorem Ipsum et Dolor Lorem Ipsum`,
            authorId: 999,
            author: { id: 999, name: 'Username', email: 'user@example.com', role: 'listener', createdAt: '' },
            createdAt: new Date().toISOString()
          }
        }
        setPost(foundPost)

        // Load comments from LocalStorage per forum ID
        const localComments = localStorage.getItem(`forum_comments_${id}`)
        if (localComments) {
          setComments(JSON.parse(localComments))
        } else {
          setComments([])
        }
      } catch (err) {
        console.error(err)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    if (id) init()
  }, [id, router])

  const saveComments = (updated: Comment[]) => {
    setComments(updated)
    localStorage.setItem(`forum_comments_${id}`, JSON.stringify(updated))
  }

  const handleSend = () => {
    if (!inputValue.trim() || !user) return

    const newComment: Comment = {
      id: `comment_${Date.now()}`,
      authorName: user.name,
      content: inputValue,
      createdAt: new Date().toISOString(),
      parentId: replyingTo ? replyingTo.id : null,
      repliedToName: replyingTo ? replyingTo.authorName : null
    }

    const updatedComments = [...comments, newComment]
    saveComments(updatedComments)
    setInputValue('')
    setReplyingTo(null)
  }

  const handleReplyClick = (comment: Comment) => {
    setReplyingTo(comment)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }

  // Flatten comments tree logic:
  // DFS to flatten comments list, keeping replies immediately below parent
  const buildFlatThread = (commentsList: Comment[]): Array<Comment & { depth: number }> => {
    const map = new Map<string | null, Comment[]>()
    commentsList.forEach(c => {
      const pId = c.parentId
      if (!map.has(pId)) map.set(pId, [])
      map.get(pId)!.push(c)
    })

    const result: Array<Comment & { depth: number }> = []

    const traverse = (parentId: string | null, depth: number) => {
      const children = map.get(parentId) || []
      // Sort children chronologically or keep insertion order
      children.forEach(child => {
        result.push({ ...child, depth })
        traverse(child.id, depth + 1)
      })
    }

    traverse(null, 0)
    return result
  }

  if (loading || !user || !post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F8F5]">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#288C49] border-t-transparent" />
        </div>
      </div>
    )
  }

  const flattenedComments = buildFlatThread(comments)

  // Use date fallback similar to overview
  const postDate = post.id === 1 && post.author?.name === 'Username' ? 'date' : formatDate(post.createdAt)

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F8F5] px-6 py-8 relative">
      {/* Top Centered Brand Logo */}
      <div className="absolute top-8 left-0 right-0 flex justify-center pointer-events-none z-0">
        <p className="font-serif text-2xl font-bold tracking-[-0.04em] text-[#288C49]">
          Zermon
        </p>
      </div>

      <div className="mx-auto w-full max-w-4xl pt-10 flex-1 flex flex-col pb-28">
        
        {/* Header / Navigation Bar */}
        <div className="flex items-center justify-between mb-4 z-10">
          <button
            onClick={() => router.push('/discuss')}
            className="text-[#288C49] hover:text-[#1a6632] transition-colors"
            aria-label="Go back"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>

        {/* Origin Question */}
        <div className="mb-8 pb-5">
          <div className="flex items-center justify-between text-sm font-semibold text-[#288C49] mb-3">
            <span>{post.author?.name || 'Username'}</span>
            <span className="text-[#4c6e4e] font-normal">{postDate}</span>
          </div>
          <h1 className="font-serif text-4xl font-extrabold tracking-tight text-[#0c3b28] mb-4 leading-tight">
            {post.title}
          </h1>
          <div className="text-[#0c3b28] font-sans text-base leading-relaxed whitespace-pre-wrap pr-2">
            {post.content}
          </div>
        </div>

        {/* Shorter Centered Divider */}
        <div className="w-[95%] mx-auto border-b-2 border-[#288C49]/20 mb-8" />

        {/* Comments Section */}
        <div className="space-y-5 flex-1">
          {flattenedComments.map((comment, idx) => {
            const hasDepth = comment.depth > 0
            const showDivider = idx < flattenedComments.length - 1 && flattenedComments[idx + 1].depth === 0

            return (
              <div key={comment.id} className="flex flex-col">
                <div
                  onClick={() => handleReplyClick(comment)}
                  style={{ marginLeft: hasDepth ? `${Math.min(comment.depth * 2.5, 8)}rem` : '0px' }}
                  className={`group flex flex-col cursor-pointer transition-all duration-150 rounded-lg p-2.5 -mx-2.5 hover:bg-[#288C49]/5 active:bg-[#288C49]/10 ${
                    hasDepth 
                      ? 'border-l-2 border-[#288c49]/20 pl-4 md:pl-6 my-2 hover:border-l-[#288C49]' 
                      : 'pb-2'
                  }`}
                  title={`Click to reply to ${comment.authorName}`}
                >
                  {/* Comment Header */}
                  <div className="flex items-center justify-between text-sm font-semibold text-[#288C49] mb-1">
                    <div className="flex items-center flex-wrap">
                      <span className="text-[#288C49]">{comment.authorName}</span>
                      {comment.repliedToName && (
                        <span className="text-[#4c6e4e] font-normal text-xs ml-2 select-none">
                          -replied to <span className="font-medium text-[#288C49]">"{comment.repliedToName}"</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[#4c6e4e] font-normal text-xs">
                      {formatCommentDate(comment.createdAt)}
                    </span>
                  </div>

                  {/* Comment Content */}
                  <div className="text-[#0c3b28] font-sans text-sm md:text-base leading-relaxed whitespace-pre-wrap pr-12">
                    {comment.content}
                  </div>
                </div>

                {showDivider && (
                  <div className="my-4 border-t-2 border-[#288C49]/20 w-[95%] mx-auto" />
                )}
              </div>
            )
          })}

          {comments.length === 0 && (
            <div className="text-center py-12 text-[#4c6e4e] font-sans text-sm">
              No replies yet. Be the first to share your thoughts!
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Input Panel */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#F4F8F5] via-[#F4F8F5]/95 to-transparent pt-6 pb-8 px-6 z-20">
        <div className="max-w-4xl mx-auto flex flex-col">
          {/* Active Reply Banner */}
          {replyingTo && (
            <div className="flex items-center justify-between bg-[#288c49]/10 text-[#0c3b28] text-xs font-semibold px-4 py-2 rounded-t-lg border-x border-t border-[#288C49]/30 transition-all duration-150">
              <span className="flex items-center gap-1">
                Replying to <strong className="text-[#288C49]">{replyingTo.authorName}</strong>
              </span>
              <button 
                onClick={() => setReplyingTo(null)}
                className="text-[#9b2c2c] hover:text-[#e53e3e] font-bold text-xs p-1"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Bottom TextInput Control */}
          <div className="relative flex items-center border border-[#288C49] rounded-xl bg-white/95 shadow-sm backdrop-blur-sm transition-all focus-within:ring-2 focus-within:ring-[#288C49]/20 focus-within:border-[#1a6632]">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend()
              }}
              placeholder="Write your answer"
              className="flex-1 bg-transparent px-5 py-4 text-base text-[#0c3b28] placeholder-[#4c6e4e]/50 outline-none pr-12"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              aria-label="Send answer"
              className="absolute right-4 text-[#288C49] hover:text-[#1a6632] transition-colors font-bold text-2xl disabled:opacity-30 disabled:pointer-events-none select-none p-1"
            >
              &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
