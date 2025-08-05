import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'blockContent',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'mdxContent',
      title: 'MDX Content',
      type: 'text',
      description: 'Optional MDX content for advanced interactive components (overrides regular content if provided)',
    }),
    defineField({
      name: 'video',
      title: 'Video',
      type: 'object',
      fields: [
        {
          name: 'url',
          title: 'Video URL',
          type: 'url',
          description: 'YouTube, Vimeo, or direct video URL',
        },
        {
          name: 'duration',
          title: 'Duration (minutes)',
          type: 'number',
        },
      ],
    }),
    defineField({
      name: 'resources',
      title: 'Resources',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: Rule => Rule.required(),
            },
            {
              name: 'file',
              title: 'File',
              type: 'file',
              options: {
                accept: '.pdf,.doc,.docx,.txt,.zip',
              },
            },
            {
              name: 'url',
              title: 'External URL',
              type: 'url',
            },
          ],
          preview: {
            select: {
              title: 'title',
              hasFile: 'file',
              hasUrl: 'url',
            },
            prepare({title, hasFile, hasUrl}) {
              return {
                title,
                subtitle: hasFile ? 'File' : hasUrl ? 'Link' : 'No resource',
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'quiz',
      title: 'Quiz Questions',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'question',
              title: 'Question',
              type: 'string',
              validation: Rule => Rule.required(),
            },
            {
              name: 'options',
              title: 'Options',
              type: 'array',
              of: [{type: 'string'}],
              validation: Rule => Rule.min(2).max(5),
            },
            {
              name: 'correctAnswer',
              title: 'Correct Answer Index',
              type: 'number',
              description: 'Index of the correct answer (0-based)',
              validation: Rule => Rule.required().min(0).max(4),
            },
            {
              name: 'explanation',
              title: 'Explanation',
              type: 'text',
              rows: 3,
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Order within the course',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      order: 'order',
    },
    prepare({title, order}) {
      return {
        title,
        subtitle: order ? `Lesson ${order}` : 'No order set',
      }
    },
  },
  orderings: [
    {
      title: 'Order',
      name: 'orderAsc',
      by: [
        {field: 'order', direction: 'asc'}
      ]
    }
  ],
})