import { getDocumentById } from '@auth/elasticsearch';

// Feature: Search for a particular gig.
// So if the user is on the index page or not yet logged in, and then they
// search for gigs and then they want to read more information about a
// particular gig, they click on it. And then this, method `gigById()` will be
// called and it will return the information related to that particular gig.
export async function gigById(index: string, gigId: string) {
  const gig = await getDocumentById(index, gigId);
  return gig;
}
