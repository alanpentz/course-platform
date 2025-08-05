// Course queries
export const coursesQuery = `*[_type == "course" && isPublished == true] {
  _id,
  title,
  slug,
  description,
  thumbnail,
  price,
  instructor->{
    name,
    email,
    bio,
    avatar
  },
  category->{
    title,
    slug
  },
  "lessonCount": count(*[_type == "lesson" && references(^._id)])
}`;

export const courseBySlugQuery = `*[_type == "course" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  description,
  thumbnail,
  price,
  isPublished,
  instructor->{
    name,
    email,
    bio,
    avatar
  },
  category->{
    title,
    slug
  },
  "lessons": *[_type == "lesson" && references(^._id)] | order(order asc) {
    _id,
    title,
    slug,
    description,
    duration,
    videoUrl,
    order
  }
}`;

// Lesson queries
export const lessonBySlugQuery = `*[_type == "lesson" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  description,
  duration,
  videoUrl,
  content,
  resources,
  "course": *[_type == "course" && references(^._id)][0] {
    _id,
    title,
    slug
  }
}`;

// Category queries
export const categoriesQuery = `*[_type == "category"] {
  _id,
  title,
  slug,
  description
}`;

// Instructor queries
export const instructorsQuery = `*[_type == "instructor"] {
  _id,
  name,
  email,
  bio,
  avatar,
  "courseCount": count(*[_type == "course" && references(^._id)])
}`;

export const instructorByEmailQuery = `*[_type == "instructor" && email == $email][0] {
  _id,
  name,
  email,
  bio,
  avatar
}`;