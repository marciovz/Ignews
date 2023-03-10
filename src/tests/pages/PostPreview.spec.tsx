import { render, screen } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { mocked } from 'jest-mock';

import Post, { getStaticPaths, getStaticProps } from '../../pages/posts/preview/[slug]';
import { getPrismicClient } from '../../services/prismic'

const post = { 
  slug: 'my-new-post', 
  title: 'My New Post', 
  content: '<p>Post excerpt</p>', 
  updatedAt: '10 de abril' 
};

jest.mock('next-auth/react');
jest.mock('../../services/prismic');
jest.mock("next/router", () => {
  return {
    useRouter: jest.fn().mockReturnValue({
      push: jest.fn()
    })
  }
});

describe('Post preview page', () => {
  it('renders correctly', () => {
    const useSessionMocked = mocked(useSession);

    useSessionMocked.mockReturnValueOnce({
      data: null,
      status: 'unauthenticated'
    });

    render (<Post post={post} />);

    expect(screen.getByText('My New Post')).toBeInTheDocument();
    expect(screen.getByText('Post excerpt')).toBeInTheDocument();
    expect(screen.getByText('Do you want to keep reading?')).toBeInTheDocument();
  });


  it('redirects user to full post when use is subcribed', async () => {
    const useSessionMocked = mocked(useSession);
    const useRouterMocked = mocked(useRouter);
    const pushMock = jest.fn()

    useSessionMocked.mockReturnValueOnce({
      data: {
        user: {
          name: 'John Doe',
          email: 'john.doe@example.com'
        },
        activeSubscription: 'fake-active-subscription',
        expires: 'fake-expires'
      },
      status: 'authenticated'
    })

    useRouterMocked.mockReturnValueOnce({
      push: pushMock,
    } as any)

    render(<Post post={post} />)

    expect(pushMock).toHaveBeenCalledWith('/posts/my-new-post')
  });


  it('loads initial data', async () => {
    const getPrismicClientMocked = mocked(getPrismicClient);

    getPrismicClientMocked.mockReturnValueOnce({
      getByUID: jest.fn().mockResolvedValueOnce({
        data: {
          title: [
            { type: 'heading', text: 'My new post' }
          ],
          content: [
            { type: 'paragraph', text: 'Post content' }
          ],
        },
        last_publication_date: '04-01-2021'
      })
    } as any);

    const response = await getStaticProps({
      params: {
        slug: 'my-new-post'
      }
    });
    
    expect(response).toEqual(
      expect.objectContaining({
        props: {
          post: {
            slug: 'my-new-post',
            title: 'My new post',
            content: '<p>Post content</p>',
            updatedAt: '01 de abril de 2021'
          }
        }
      })
    )
  });

  it('return object configuration when calls function getStaticPaths', () => {
    const configStaticPaths = getStaticPaths();

    expect(configStaticPaths).toEqual({
        paths: [],
        fallback: "blocking",
      })
  })


})