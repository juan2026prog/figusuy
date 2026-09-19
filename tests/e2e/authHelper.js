export const MOCK_USER_ID = 'mock-user-123'
export const MOCK_OTHER_USER_ID = 'user-other-456'

export async function setupAuthenticatedState(page) {
  // Pre-seed and override Storage.prototype for Supabase auth token and dismiss modals
  await page.addInitScript(() => {
    const sessionData = {
      access_token: 'mock-jwt-token-playwright',
      token_type: 'bearer',
      expires_in: 3600000,
      expires_at: Math.floor(Date.now() / 1000) + 3600000,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-user-123',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'test@figusuy.com',
        user_metadata: { name: 'Juan Test' },
        app_metadata: { provider: 'email' },
        created_at: '2026-01-01T00:00:00Z',
      }
    };

    const sessionStr = JSON.stringify(sessionData);

    const origGet = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key) {
      if (typeof key === 'string') {
        if (key.includes('auth-token') || key.includes('supabase.auth.token')) {
          return sessionStr;
        }
        if (key === 'figusuy_alpha_dismissed') {
          return 'alpha_1';
        }
      }
      return origGet.call(this, key);
    };

    try {
      window.localStorage.setItem('supabase.auth.token', sessionStr);
      window.localStorage.setItem('sb-test-auth-token', sessionStr);
      window.localStorage.setItem('figusuy_alpha_dismissed', 'alpha_1');
      window.localStorage.setItem('onboarding_dismissed', 'true');
    } catch (e) {}
  });

  // Intercept Supabase Auth API
  await page.route('**/auth/v1/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/user') || url.includes('/session') || url.includes('/token')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: MOCK_USER_ID,
          email: 'test@figusuy.com',
          role: 'authenticated',
          aud: 'authenticated',
          user_metadata: { name: 'Juan Test' },
          access_token: 'mock-jwt-token-playwright',
          token_type: 'bearer',
          expires_in: 3600000,
          expires_at: Math.floor(Date.now() / 1000) + 3600000,
          user: {
            id: MOCK_USER_ID,
            email: 'test@figusuy.com',
            role: 'authenticated',
            aud: 'authenticated',
            user_metadata: { name: 'Juan Test' }
          }
        })
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      });
    }
  });

  // Intercept Supabase REST API
  await page.route('**/rest/v1/**', async (route) => {
    const url = route.request().url();
    const headers = route.request().headers();
    const isSingle = headers['accept'] && headers['accept'].includes('vnd.pgrst.object+json');

    if (url.includes('/profiles')) {
      const myProfile = {
        id: MOCK_USER_ID,
        name: 'Juan Test',
        username: 'juantest',
        email: 'test@figusuy.com',
        role: 'user',
        plan_name: 'gratis',
        is_premium: false,
        city: 'Montevideo',
        department: 'Montevideo',
        account_type: 'user',
        avatar_url: null,
        is_verified: false,
        alpha_notice_seen: true,
        alpha_notice_version: 'alpha_1',
        onboarding_completed: true,
        onboarding_step: 4
      };
      const otherProfile = {
        id: MOCK_OTHER_USER_ID,
        name: 'Carlos Gomez',
        username: 'carlosg',
        email: 'carlos@figusuy.com',
        role: 'user',
        plan_name: 'gratis',
        is_premium: false,
        city: 'Montevideo',
        department: 'Montevideo',
        account_type: 'user',
        avatar_url: null,
        is_verified: false,
        alpha_notice_seen: true,
        alpha_notice_version: 'alpha_1'
      };

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isSingle ? myProfile : [myProfile, otherProfile])
      });
    } else if (url.includes('/user_roles')) {
      const roleData = { user_id: MOCK_USER_ID, role: 'user' };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isSingle ? roleData : [roleData])
      });
    } else if (url.includes('/rpc/get_user_plan_rules')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          max_albums: 10,
          max_duplicates: 100,
          can_match: true,
          can_chat: true,
          verified_badge: false
        })
      });
    } else if (url.includes('/rpc/get_user_stars')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(5)
      });
    } else if (url.includes('/premium_plans')) {
      const plans = [
        { id: 'plan-plus-1', name: 'Plus', plan_name: 'plus', price: '2.49', interval: 'month', is_active: true },
        { id: 'plan-pro-1', name: 'Pro', plan_name: 'pro', price: '4.85', interval: 'month', is_active: true }
      ];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isSingle ? plans[0] : plans)
      });
    } else if (url.includes('/business_plans')) {
      const bplans = [
        { id: 'bp-1', name: 'Plan Boost', plan_name: 'gratis', monthly_price: 590, is_active: true, max_photos: 1, max_active_promos: 1 },
        { id: 'bp-2', name: 'Plan Radar', plan_name: 'turbo', monthly_price: 990, is_active: true, max_photos: 3, max_active_promos: 3, can_have_featured_badge: true },
        { id: 'bp-3', name: 'Plan Conversion', plan_name: 'dominio', monthly_price: 1490, is_active: true, max_photos: 10, max_active_promos: 10, can_have_featured_badge: true, can_have_featured_cta: true },
        { id: 'bp-4', name: 'Plan Collector Hub', plan_name: 'partner_store', monthly_price: 1490, is_active: true, max_photos: 10, max_active_promos: 10, can_have_featured_badge: true, can_have_featured_cta: true }
      ];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isSingle ? bplans[0] : bplans)
      });
    } else if (url.includes('/albums')) {
      const albumData = {
        id: 'album-1',
        name: 'Copa América 2024',
        total_stickers: 100,
        is_active: true
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isSingle ? albumData : [albumData])
      });
    } else if (url.includes('/user_albums')) {
      const uaData = {
        id: 'ua-1',
        user_id: MOCK_USER_ID,
        album_id: 'album-1',
        is_active: true,
        album: { id: 'album-1', name: 'Copa América 2024', total_stickers: 100 }
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isSingle ? uaData : [uaData])
      });
    } else if (url.includes('/chats')) {
      const chatData = {
        id: 'mock-chat-1',
        user_1: MOCK_USER_ID,
        user_2: MOCK_OTHER_USER_ID,
        album_id: 'album-1',
        last_message_preview: 'Dale, nos vemos ahí',
        last_message_at: '2026-05-01T10:00:00Z',
        last_sender_id: MOCK_OTHER_USER_ID,
        profile1: { id: MOCK_USER_ID, name: 'Juan Test', username: 'juantest', city: 'Montevideo' },
        profile2: { id: MOCK_OTHER_USER_ID, name: 'Carlos Gomez', username: 'carlosg', city: 'Montevideo', department: 'Montevideo' },
        album: { id: 'album-1', name: 'Copa América 2024' }
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isSingle ? chatData : [chatData])
      });
    } else if (url.includes('/messages')) {
      const msgData = {
        id: 'msg-1',
        chat_id: 'mock-chat-1',
        sender_id: MOCK_OTHER_USER_ID,
        text: 'Dale, nos vemos ahí',
        created_at: '2026-05-01T10:00:00Z'
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isSingle ? msgData : [msgData])
      });
    } else if (url.includes('/stores') || url.includes('/partner_stores')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'store-1',
            name: 'Kiosko Central',
            address: '18 de Julio 1234',
            city: 'Montevideo',
            department: 'Montevideo',
            is_verified: true,
            latitude: -34.9011,
            longitude: -56.1645
          }
        ])
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(isSingle ? null : [])
      });
    }
  });

  // Intercept Supabase Edge Functions & Realtime
  await page.route('**/functions/v1/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ matches: [], enabled: true })
    });
  });
}
