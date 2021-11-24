<template>
  <Sticky class="mb-4">
    <nav id="topnav" class="width-full header-bg">
      <Container>
        <div class="d-flex flex-items-center" style="height: 78px">
          <div class="flex-auto d-flex flex-items-center">
            <img :src="require(`@/assets/fundi/logo.png`)" width="200" />
          </div>
          <div :key="web3.account">
            <template v-if="$auth.isAuthenticated && this.chainId == web3.chainId">
              <UiButton
                @click="modalOpen = true"
                class="button-header"
                :loading="loading"
              >
                <Avatar
                  :address="web3.account"
                  size="16"
                  class="mr-0 mr-sm-2 mr-md-2 mr-lg-2 mr-xl-2 ml-n1"
                />
                <span v-if="web3.name" v-text="web3.name" class="hide-sm" />
                <span v-else v-text="_shorten(web3.account)" class="hide-sm" />
              </UiButton>
            </template>
            <UiButton
              v-if="!$auth.isAuthenticated"
              @click="modalOpen = true"
              class="button-header"
              style="background-color: #c5c8a9"
              :loading="loading"
            >
              Connect<span class="hide-sm" v-text="' wallet'" />
            </UiButton>
            <UiButton
              v-if="this.chainId != web3.chainId"
              class="button-header"
              @click="switchNetwork">
              Switch<span class="hide-sm" v-text="' Network'" />
            </UiButton>
            <UiButton @click="modalAboutOpen = true" class="ml-2 button-header">
              <span v-text="'?'" class="ml-n1 mr-n1" />
            </UiButton>
          </div>
        </div>
        <ModalAccount
          :open="modalOpen"
          @close="modalOpen = false"
          @login="handleLogin"
        />
        <ModalAbout :open="modalAboutOpen" @close="modalAboutOpen = false" />
      </Container>
    </nav>
  </Sticky>
</template>

<script>
import { mapActions } from 'vuex';
import config from '@/config.json';

export default {
  data() {

    return {
      loading: false,
      modalOpen: false,
      modalAboutOpen: false,
      chainId: config.chainId,
    };
  },
  computed: {
    space() {
      try {
        return this.web3.spaces[this.$route.params.key];
      } catch (e) {
        return false;
      }
    },
  },
  methods: {
    ...mapActions(['login']),
    async handleLogin(connector) {
      this.modalOpen = false;
      this.loading = true;
      await this.login(connector);
      this.loading = false;
    },
    async switchNetwork() {
      console.log('switch network');
      try {
        window.web3.currentProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }],
        });
      } catch (error) {
        console.log('[TestHandler] error ==>', error);
      }
    }
  },
};
</script>
