<template>
  <UiModal :open="open" @close="$emit('close')">
    <form @submit.prevent="handleSubmit" class="modal-body">
      <div v-if="step === 0">
        <h3 class="m-4 text-center">Select {{ selectedDate }} date</h3>
        <div class="modal-body m-4">
          <UiCalendar v-model="input" class="mx-auto mb-2" />
        </div>
      </div>
      <div v-else>
        <h3 class="m-4 mb-0 text-center">Select {{ selectedDate }} time</h3>
        <div class="d-flex m-4 mx-auto" style="max-width: 160px">
          <UiButton class="px-0 width-fit">
            <input
              v-model="form.h"
              min="0"
              max="24"
              class="input text-center col-5"
            />
            <span class="col-2">:</span>
            <input
              v-model="form.m"
              min="0"
              max="60"
              class="input text-center col-5"
            />
          </UiButton>
        </div>
      </div>
      <div class="p-4 overflow-hidden text-center border-top">
        <div class="col-6 float-left pr-2">
          <UiButton @click="$emit('close')" type="button" class="width-full">
            Cancel
          </UiButton>
        </div>
        <div class="col-6 float-left pl-2">
          <UiButton type="submit" class="width-full button--submit">
            <span v-if="step === 0">Next</span>
            <span v-else>Select</span>
          </UiButton>
        </div>
      </div>
    </form>
  </UiModal>
</template>

<script>
export default {
  props: ['open', 'value', 'selectedDate'],
  data() {
    return {
      input: '',
      step: 0,
      form: {
        h: '12',
        m: '00',
      },
    };
  },
  watch: {
    open() {
      this.step = 0;
      this.form = { h: '12', m: '00' };
      this.input = this.value;
    },
  },
  methods: {
    handleSubmit() {
      if (this.step === 0) return (this.step = 1);
      const currentDate = new Date();
      const [year, month, day] = this.input.split('-');
      const date = new Date(year, month - 1, day);
      if ((date <= currentDate) & (this.form.h < currentDate.getHours())) {
        this.form.h = currentDate.getHours();
        this.form.m = currentDate.getMinutes();
      }
      date.setHours(this.form.h, this.form.m, 0);
      const input = date.getTime() / (1e3).toFixed();
      this.$emit('input', input);
      this.$emit('close');
    },
  },
};
</script>
