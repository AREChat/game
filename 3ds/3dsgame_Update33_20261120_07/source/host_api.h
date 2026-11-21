#ifndef HOST_API_H
#define HOST_API_H
void host_set_script(const unsigned *keys, int n);
void host_set_max_frames(int n);
void host_set_input_name(const char *s);
void host_set_save_path(const char *p);
const char *host_screen_text(void);
int host_frame(void);
int host_rect_count(void);
int host_sfx_count(int id);   /* Update32: そのこうかおんが なった回数 */
int host_sfx_total(void);
int host_voice_count(void);
int host_shake_x(void);
int host_shake_y(void);
#endif
