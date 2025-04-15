export interface Comment {
  id: number;
  text: string;
  date: Date;
}

export interface BlogPost {
  id: number;
  title: string;
  content: string;
  imageUrl: string;
  author: string;
  date: string;
  comments: Comment[]; 
}

export const blog: BlogPost[] =  [
    {
        id: 1,
          title: "The Future of Web Development",
          content: "As we look ahead to the future of web development, artificial intelligence and machine learning are becoming increasingly integral to how we build and maintain web applications. From automated testing to AI-powered development assistants, the landscape of web development is evolving rapidly. Developers need to stay adaptable and continue learning to keep pace with these changes.",
          imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=2072",
          author: "Sarah Johnson",
          date: "March 15, 2024",
          comments: []
    },
    {
        id: 2,
        title: "Building Accessible Web Applications",
        content: "Accessibility in web development isn't just a nice-to-have feature—it's a necessity. Creating websites that are accessible to all users, regardless of their abilities, is crucial for building an inclusive digital world. This includes proper semantic HTML, ARIA labels, keyboard navigation, and ensuring good contrast ratios in your design.",
        imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&q=80&w=2069",
        author: "Michael Chen",
        date: "March 14, 2024",
        comments: []
      }
]