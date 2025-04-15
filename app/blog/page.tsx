"use client"
import React, { useEffect, useState } from "react";
import { Comment, blog, BlogPost } from "../assets/data";
import Image from "next/image";
import { MessageSquare } from 'lucide-react';
import SpeechToTextComment from './../../components/SpeechToTextComment';

function BlogPage() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [commentCounts, setCommentCounts] = useState<{ [key: number]: number }>({});

  // Cập nhật số lượng comment khi selectedPost thay đổi
  useEffect(() => {
    if (selectedPost) {
      setCommentCounts(prev => ({
        ...prev,
        [selectedPost.id]: selectedPost.comments.length
      }));
    }
  }, [selectedPost]);

  const handleCommentSubmit = (postId: number, text: string) => {
    const newComment: Comment = {
      id: Date.now(),
      text,
      date: new Date()
    };

    setSelectedPost(prev => {
      if (prev && prev.id === postId) {
        const updatedPost = {
          ...prev,
          comments: [...prev.comments, newComment]
        };

        return updatedPost;
      }
      return prev;
    });

    // Cập nhật số lượng comment của bài viết đó
    setCommentCounts(prev => ({
      ...prev,
      [postId]: (prev[postId] || 0) + 1
    }));
  };

  return (
    <>
      <header className="bg-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Tech Blog</h1>
        </div>
      </header>
      <hr />
      <ul className="bg-gray-100 py-1">
        {blog.map((item) => (
          <div key={item.id} className="rounded-md bg-white mt-3 max-w-5xl px-4 py-8 mx-auto">
            <li className="max-w-3xl mx-auto">
              <div className="rounded-2xl bg-amber-50 shadow-md overflow-hidden">
                <Image src={item.imageUrl} alt="Landscape picture" width={1920} height={1080} layout="responsive" />
                <h1 className="text-2xl font-bold text-gray-900 p-3">{item.title}</h1>
                <p className="text-gray-600 p-3">{item.content}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 p-3">
                  <span>{item.author}</span>
                  <span>{item.date}</span>
                </div>
                <button
                  onClick={() => setSelectedPost(selectedPost?.id === item.id ? null : item)}
                  className="mt-4 mb-3 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  <MessageSquare className="w-4 h-4 ml-3" />
                  {commentCounts[item.id] ?? item.comments.length} Comments
                </button>
                {selectedPost?.id === item.id && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 p-3 text-blue-600">Comments</h3>
                    <div className="space-y-4 mb-6">
                      {selectedPost.comments.map(comment => (
                        <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-amber-600">{comment.text}</p>
                          <p className="text-sm text-black mt-2">{comment.date.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                    <SpeechToTextComment onSubmit={(text) => handleCommentSubmit(item.id, text)} />
                  </div>
                )}
              </div>
            </li>
          </div>
        ))}
      </ul>
    </>
  );
}

export default BlogPage;
