/* @ All the methods we need inside the Auth Service is in this API Gateway */

import axios, { AxiosResponse } from 'axios';
import { AxiosService } from '@gateway/services/axios';
import { config } from '@gateway/config';
import { IAuth } from '@colson0x1/tradenexus-shared';

// NOTE: Im not going to use the same axios instance for all the services. So
// each servive will have its own Axios Instance. The reasons for it is, we need
// to add the JWT token coming from the client that is added to the cookie
// session. So we need to append it to the request that is going from the API
// gateway to the microservices i.e in this case, to the auth service. So the
// auth service will have its own Axios Instance. The user service will have
// its own axios instance. Like that.
export let axiosAuthInstance: ReturnType<typeof axios.create>;

class AuthService {
  axiosService: AxiosService;

  constructor() {
    // This service name i.e the second argument in AxiosService i.e 'auth'
    // right here is what will be added as the `requestGatewayToken` in
    // axios.ts. So we add it as the id, and we sign and then append it or
    // add it to our headers. So `auth` here is service name.
    this.axiosService = new AxiosService(`${config.AUTH_BASE_URL}/api/v1/auth`, 'auth');
    // axiosCreateInstance returns an instance on axios.ts. And in that
    // instance property, we need the axios. This is why axios instance is
    // equal to this.axiosService.axios
    axiosAuthInstance = this.axiosService.axios;
  }

  // Im going to use axiosAuthInstance. THe reason im why im using axiosAuthInstance
  // and not this.axiosService is because for the currentUser to get the current user,
  // the user has to be already be logged in. ANd current user route is going
  // to be a protected route. We are only be able to access it if the user is
  // logged in.
  // So if we want to make requests to endpoints in the authentication service
  // that is not protected, we used `this.axiosService`. The reason is, on
  // gateway/src/server.ts, so on `axiosAuthInstance`, im adding the Bearer
  // token to the Authorization i.e axiosAuthInstance.defaults.headers line,
  // butim not adding it to the axiosService instance here on the constructor.
  async getCurrentUser(): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosAuthInstance.get('/currentUser');
    return response;
  }

  async getRefreshToken(username: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosAuthInstance.get(`/refresh-token/${username}`);
    return response;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosAuthInstance.put('/change-password', { currentPassword, newPassword });
    return response;
  }

  async verifyEmail(token: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosAuthInstance.put('/verify-email', { token });
    return response;
  }

  // For resendEmail, the user needs to be logged in so `axiosAuthInstance`
  // Im destucturing and defining type here because I dont have a type defined
  async resendEmail(data: { userId: number; email: string }): Promise<AxiosResponse> {
    const response: AxiosResponse = await axiosAuthInstance.post('/resend-email', data);
    return response;
  }

  // AxiosService that dont require to access a protected route
  async signUp(body: IAuth): Promise<AxiosResponse> {
    // the `body` is an object, so we can pass it directly right here on the
    // second argument
    const response: AxiosResponse = await this.axiosService.axios.post('/signup', body);
    return response;
  }

  // NOTE:  On `getCurrentUser()`, `getRefreshToken()` and `changePassword()`
  // methods, im using `axiosAuthInstance` because I want to acess routes
  // that are protected. So it requires the JWT token. But here, im using
  // `this.axiosService.axios` because im accessing routes that are
  // not protected with the user doesn't need to be logged in to access this
  // routes.
  async signIn(body: IAuth): Promise<AxiosResponse> {
    const response: AxiosResponse = await this.axiosService.axios.post('/signin', body);
    return response;
  }

  async forgotPassword(email: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await this.axiosService.axios.put('/forgot-password', { email });
    return response;
  }

  async resetPassword(token: string, password: string, confirmPassword: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await this.axiosService.axios.put(`/reset-password/${token}`, { password, confirmPassword });
    return response;
  }

  /* Example of how this requests/endopints will look like from the frontend:
   * At first, when the user types into the searchbox, we're going to have
   * only this kind of query i.e `query` equals to whatever the user types in.
   * `/auth/search/gig/0/10/forward?query=programming`
   * And then when the user wants to filter by delivery time, im going to
   * append this delivery time. And then when the user wants to filter by
   * minimum and maximum price, then im going to append those associated
   * params as well. So this is how its going to look:
   * `/auth/search/gig/0/10/forward?query=programming&delivery_time=3&minPrice=5&maxPrice=20`
   * */
  async getGigs(query: string, from: string, size: string, type: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await this.axiosService.axios.get(`/search/gig/${from}/${size}/${type}?${query}`);
    return response;
  }

  async getGig(gigId: string): Promise<AxiosResponse> {
    const response: AxiosResponse = await this.axiosService.axios.get(`/search/gig/${gigId}`);
    return response;
  }

  // count is the number of items we want to create
  async seed(count: number): Promise<AxiosResponse> {
    const response: AxiosResponse = await this.axiosService.axios.get(`/seed/${count}`);
    return response;
  }
}

export const authService: AuthService = new AuthService();
