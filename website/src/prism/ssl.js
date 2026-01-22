/**
 * Prism syntax highlighting for SSL (Star Trek Scripting Language)
 * Used in Fallout 2 modding.
 *
 * AUTO-GENERATED from docs/ssl/functions/*.mdx
 * Run: node scripts/generate-prism-ssl.js
 *
 * Last generated: 2026-01-21T09:03:13.335Z
 * Function count: 336
 */

const sslLanguage = {
  comment: [
    {
      pattern: /\/\*[\s\S]*?\*\//,
      greedy: true,
    },
    {
      pattern: /\/\/.*/,
      greedy: true,
    },
  ],
  string: {
    pattern: /"(?:[^"\\]|\\.)*"/,
    greedy: true,
  },
  directive: {
    pattern: /#\s*(?:include|define|ifdef|ifndef|else|endif|undef)\b.*/,
    alias: 'property',
  },
  keyword:
    /\b(?:if|then|else|while|do|begin|end|return|call|procedure|variable|for|foreach|in|break|continue|and|or|not|bwand|bwor|bwxor|bwnot|import|export)\b/,
  'class-name': {
    pattern: /\b(?:int|void|float|string|boolean|ObjectPtr|any)\b/,
    alias: 'class-name',
  },
  builtin: {
    pattern:
      /\b(?:abs|action_being_used|active_hand|add_mult_objs_to_inven|add_obj_to_inven|add_timer_event|anim|anim_action_frame|anim_busy|animate_move_obj_to_tile|animate_rotation|animate_run_to_tile|animate_set_frame|animate_stand|animate_stand_obj|animate_stand_reverse|animate_stand_reverse_obj|arctan|array_key|arrayexpr|art_anim|art_change_fid_num|art_exists|atof|atoi|attack|attack_complex|attack_setup|boption|car_current_town|car_give_gas|car_give_to_party|ceil|charcode|combat_difficulty|combat_is_initialized|cos|create_array|create_message_window|create_object|create_object_sid|critter_add_trait|critter_attempt_placement|critter_dmg|critter_heal|critter_injure|critter_inven_obj|critter_is_fleeing|critter_mod_skill|critter_rm_trait|critter_set_flee_state|critter_skill_level|critter_state|critter_stop_attacking|cur_map_index|cur_town|days_since_visited|debug_msg|destroy_mult_objs|destroy_object|dialogue_reaction|dialogue_system_enter|difficulty_level|display_msg|div|do_check|drop_obj|drug_influence|dude_obj|elevation|end_dialogue|endgame_movie|endgame_slideshow|exp|explosion|fix_array|fixed_param|float_msg|force_encounter|force_encounter_with_flags|free_array|game_loaded|game_ticks|game_time|game_time_advance|game_time_hour|game_ui_disable|game_ui_enable|game_ui_is_disabled|gdialog_barter|gdialog_mod_barter|gdialog_set_barter_mod|get_array|get_attack_type|get_bodypart_hit_modifier|get_critter_base_stat|get_critter_extra_stat|get_critter_stat|get_day|get_game_mode|get_ini_section|get_ini_sections|get_ini_setting|get_ini_string|get_month|get_mouse_buttons|get_mouse_x|get_mouse_y|get_pc_base_stat|get_pc_extra_stat|get_pc_stat|get_poison|get_proto_data|get_screen_height|get_screen_width|get_script|get_sfall_arg|get_sfall_arg_at|get_sfall_global_int|get_uptime|get_weapon_ammo_count|get_weapon_ammo_pid|get_window_under_mouse|get_world_map_x_pos|get_world_map_y_pos|get_year|gfade_in|gfade_out|giq_option|giq_option_macro|give_exp_points|global_var|goption|gsay_end|gsay_end_macro|gsay_message|gsay_message_macro|gsay_option|gsay_option_macro|gsay_reply|gsay_reply_macro|gsay_start|gsay_start_macro|has_skill|has_trait|hide_iface_tag|how_much|in_world_map|inven_cmds|inven_count|inven_ptr|inven_unwield|is_critical|is_iface_tag_active|is_loading_game|is_skill_tagged|is_success|item_caps_adjust|item_caps_total|jam_lock|key_pressed|kill_critter|kill_critter_type|language_filter_is_on|len_array|list_as_array|list_begin|list_end|list_next|load_map|local_var|log|map_first_run|map_is_known|map_var|message_box|message_str|message_str_game|metarule2_explosions|move_obj_inven_to_obj|move_to|nmessage|noption|obj_art_fid|obj_being_used_with|obj_blocking_line|obj_blocking_tile|obj_can_hear_obj|obj_can_see_obj|obj_carrying_pid_obj|obj_close|obj_drop_everything|obj_is_carrying_obj_pid|obj_is_locked|obj_is_open|obj_is_visible_flag|obj_item_subtype|obj_lock|obj_name|obj_on_screen|obj_open|obj_pid|obj_set_light_level|obj_type|obj_unlock|override_map_start|party_add|party_member_count|party_member_list|party_member_obj|party_remove|pickup_obj|play_gmovie|play_sfx|poison|pow|proto_data|radiation_dec|radiation_inc|random|read_byte|read_int|reg_anim_animate|reg_anim_animate_and_hide|reg_anim_animate_and_move|reg_anim_animate_forever|reg_anim_animate_reverse|reg_anim_begin|reg_anim_callback|reg_anim_change_fid|reg_anim_clear|reg_anim_end|reg_anim_obj_move_to_obj|reg_anim_obj_move_to_tile|reg_anim_obj_run_to_obj|reg_anim_obj_run_to_tile|reg_anim_play_sfx|register_hook|register_hook_proc|reply|resize_array|rm_fixed_timer_event|rm_mult_objs_from_inven|rm_obj_from_inven|rm_timer_event|roll_dice|roll_vs_skill|rotation_to_tile|round|running_burning_guy|scan_array|scr_return|script_action|script_overrides|self_obj|set_array|set_bodypart_hit_modifier|set_car_current_town|set_critter_base_stat|set_critter_extra_stat|set_critter_stat|set_exit_grids|set_global_script_repeat|set_global_script_type|set_global_var|set_light_level|set_local_var|set_map_start|set_map_time_multi|set_map_var|set_obj_visibility|set_pc_base_stat|set_pc_extra_stat|set_proto_data|set_self|set_sfall_arg|set_sfall_global|set_sfall_return|set_weapon_ammo_count|set_weapon_ammo_pid|set_window_flag|set_world_map_pos|sfall_func0|sfall_func1|sfall_func2|sfall_func3|sfall_func4|sfall_func5|sfall_func6|sfall_func7|sfall_func8|sfall_func_n|sfall_ver_build|sfall_ver_major|sfall_ver_minor|show_iface_tag|signal_end_game|sin|skill_contest|source_obj|sprintf|sqrt|start_dialogue|start_gdialog|start_gialog|string_split|strlen|substr|tan|tap_key|target_obj|temp_array|terminate_combat|tile_contains_obj_pid|tile_contains_pid_obj|tile_distance|tile_distance_objs|tile_is_visible|tile_num|tile_num_in_direction|tile_under_cursor|toggle_active_hand|town_known|typeof|use_obj|use_obj_on_obj|using_skill|violence_level_setting|wield_obj|wield_obj_critter|wm_area_set_pos|world_map|world_map_x_pos|world_map_y_pos|write_byte|write_int)\b/,
    alias: 'function',
  },
  constant: {
    pattern:
      /\b(?:STAT_[A-Za-z_]+|SKILL_[A-Za-z_]+|PERK_[A-Za-z_]+|TRAIT_[A-Za-z_]+|PID_[A-Za-z_]+|SCRIPT_[A-Za-z_]+|OBJ_TYPE_[A-Za-z_]+|ITEM_TYPE_[A-Za-z_]+|DAMAGE_TYPE_[A-Za-z_]+|DMG_[A-Za-z_]+|KILL_TYPE_[A-Za-z_]+|GVAR_[A-Za-z_]+|LVAR_[A-Za-z_]+|MVAR_[A-Za-z_]+|FLOAT_MSG_[A-Za-z_]+|INVEN_TYPE_[A-Za-z_]+|INVEN_CMD_[A-Za-z_]+|ANIM_[A-Za-z_]+|DAM_[A-Za-z_]+|PCSTAT_[A-Za-z_]+|METARULE[0-9]*_[A-Za-z_]+|GOOD|NEUTRAL|BAD|TRUE|FALSE|true|false|NULL)\b/,
    alias: 'constant',
  },
  number: [
    {
      pattern: /\b0x[0-9a-fA-F]+\b/,
    },
    {
      pattern: /\b\d+(?:\.\d+)?\b/,
    },
  ],
  operator: /\+|-|\*|\/|%|:=|==|!=|<=|>=|<|>/,
  punctuation: /[{}[\];(),]/,
};

module.exports = sslLanguage;
