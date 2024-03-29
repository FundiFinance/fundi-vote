<template>
  <Container :slim="true">
    <div class="px-4 px-md-0 mb-3">
      <router-link
        :to="{ name: 'proposals', params: { key } }"
        class="text-gray"
      >
        <Icon name="back" size="22" class="v-align-middle" />
        {{ space.name }}
      </router-link>
    </div>
    <div>
      <div class="col-12 col-lg-8 float-left pr-0 pr-lg-5">
        <div class="px-4 px-md-0">
          <div class="d-flex flex-column mb-6">
            <input
              v-autofocus
              v-model="form.name"
              maxlength="128"
              class="h1 mb-2 input"
              placeholder="Question"
            />
            <textarea-autosize
              v-model="form.body"
              maxlength="10240"
              class="input mb-6"
              placeholder="What is your proposal?"
            />
            <div v-if="form.body">
              <h4 class="mb-4">Preview</h4>
              <UiMarkdown :body="form.body" />
            </div>
          </div>
        </div>
        <Block title="Choices">
          <div v-if="choices.length > 0" class="overflow-hidden mb-2">
            <draggable v-model="choices">
              <transition-group name="list">
                <div
                  v-for="(choice, i) in choices"
                  :key="choice.key"
                  class="d-flex mb-2"
                >
                  <UiButton class="d-flex width-full button-choice">
                    <span class="mr-4">{{ i + 1 }}</span>
                    <input
                      v-model="choices[i].text"
                      class="input height-full flex-auto text-center"
                    />
                    <span @click="removeChoice(i)" class="ml-4">
                      <Icon name="close" size="12" />
                    </span>
                  </UiButton>
                </div>
              </transition-group>
            </draggable>
          </div>
          <UiButton @click="addChoice(1)" class="d-block width-full">
            Add choice
          </UiButton>
        </Block>
      </div>
      <div class="col-12 col-lg-4 float-left">
        <Block title="Actions">
          <div class="mb-2">
            <UiButton
              @click="[(modalOpen = true), (selectedDate = 'start')]"
              class="width-full mb-2"
            >
              <span v-if="!form.start">Select start date</span>
              <span v-else v-text="$d(form.start * 1e3, 'short')" />
            </UiButton>
            <UiButton
              @click="[(modalOpen = true), (selectedDate = 'end')]"
              class="width-full mb-2"
            >
              <span v-if="!form.end">Select end date</span>
              <span v-else v-text="$d(form.end * 1e3, 'short')" />
            </UiButton>
          </div>
          <UiButton
            @click="handleSubmit"
            :disabled="!isValid"
            :loading="loading"
            class="d-block width-full button--submit"
          >
            <span v-if="!isPeriodValid">Period must be at least 48h</span>
            <span v-else>Publish</span>
          </UiButton>
        </Block>
      </div>
    </div>
    <ModalSelectDate
      :value="form[selectedDate]"
      :selectedDate="selectedDate"
      :open="modalOpen"
      @close="modalOpen = false"
      @input="setDate"
    />
  </Container>
</template>

<script>
import { mapActions } from 'vuex';
import draggable from 'vuedraggable';

export default {
  components: {
    draggable,
  },
  data() {
    return {
      key: this.$route.params.key,
      loading: false,
      choices: [],
      form: {
        name: '',
        body: '',
        choices: [],
        start: '',
        end: '',
        metadata: {},
      },
      modalOpen: false,
      selectedDate: '',
      counter: 0,
    };
  },
  computed: {
    isPeriodValid() {
      if (
        this.form.start &&
        this.form.end &&
        this.form.start != '' &&
        this.form.end != '' &&
        this.form.end > this.form.start
      ) {
        return Math.floor((this.form.end - this.form.start) / 60 / 60) >= 48;
      }
      return true;
    },
    space() {
      return this.web3.spaces[this.key];
    },
    isValid() {
      const minPeriod =
        Math.floor((this.form.end - this.form.start) / 60 / 60) >= 48;

      return (
        !this.loading &&
        this.web3.account &&
        this.form.name &&
        this.form.body &&
        this.form.start &&
        // this.form.start >= ts &&
        this.form.end &&
        this.form.end > this.form.start &&
        minPeriod &&
        this.choices.length >= 2 &&
        !this.choices.some(a => a.text === '')
      );
    },
  },
  mounted() {
    this.addChoice(2);
  },
  methods: {
    ...mapActions(['send']),
    addChoice(num) {
      for (let i = 1; i <= num; i++) {
        this.counter++;
        this.choices.push({ key: this.counter, text: '' });
      }
    },
    removeChoice(i) {
      this.choices.splice(i, 1);
    },
    setDate(ts) {
      if (this.selectedDate) {
        this.form[this.selectedDate] = ts;
      }
    },
    async handleSubmit() {
      this.loading = true;
      this.form.choices = this.choices.map(choice => choice.text);
      try {
        const { ipfsHash } = await this.send({
          token: this.space.address,
          type: 'proposal',
          payload: this.form,
        });
        this.$router.push({
          name: 'proposal',
          params: {
            key: this.key,
            id: ipfsHash,
          },
        });
      } catch (e) {
        console.error(e);
        this.loading = false;
      }
    },
  },
};
</script>

<style>
.list-leave-active,
.list-enter-active {
  transition: all 0.3s;
}
.list-move {
  transition: transform 0.3s;
}
.list-enter,
.list-leave-to {
  opacity: 0;
}
</style>
