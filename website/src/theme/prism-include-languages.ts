/**
 * Custom prism-include-languages to add SSL language support.
 */

import siteConfig from '@generated/docusaurus.config';
import type * as PrismNamespace from 'prismjs';
import type {Optional} from 'utility-types';

export default function prismIncludeLanguages(
  PrismObject: typeof PrismNamespace,
): void {
  const {
    themeConfig: {prism},
  } = siteConfig;
  const {additionalLanguages} = prism as {additionalLanguages: string[]};

  // Prism components work on the Prism instance on the window, while prism-
  // react-renderer uses its own Prism instance. We temporarily mount the
  // instance onto window, import components to enhance it, then remove it to
  // avoid polluting global namespace.
  // You can mutate PrismObject: registering plugins, deleting languages... As
  // long as you don't re-assign it

  const PrismBefore = globalThis.Prism;
  globalThis.Prism = PrismObject;

  additionalLanguages.forEach((lang) => {
    if (lang === 'php') {
      // eslint-disable-next-line global-require
      require('prismjs/components/prism-markup-templating.js');
    }
    // eslint-disable-next-line global-require, import/no-dynamic-require
    require(`prismjs/components/prism-${lang}`);
  });

  // Register SSL language for Fallout 2 scripting
  PrismObject.languages.ssl = {
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
    builtin: {
      pattern:
        /\b(?:action_being_used|add_mult_objs_to_inven|add_obj_to_inven|add_timer_event|anim|anim_action_frame|anim_busy|animate_move_obj_to_tile|animate_rotation|animate_run_to_tile|animate_set_frame|animate_stand|animate_stand_obj|animate_stand_reverse|animate_stand_reverse_obj|art_anim|attack|attack_complex|attack_setup|car_current_town|car_give_gas|car_give_to_party|combat_difficulty|combat_is_initialized|create_object|create_object_sid|critter_add_trait|critter_attempt_placement|critter_dmg|critter_heal|critter_injure|critter_inven_obj|critter_is_fleeing|critter_mod_skill|critter_rm_trait|critter_set_flee_state|critter_skill_level|critter_state|critter_stop_attacking|cur_map_index|cur_town|days_since_visited|debug_msg|destroy_mult_objs|destroy_object|dialogue_reaction|dialogue_system_enter|difficulty_level|display_msg|do_check|drop_obj|drug_influence|dude_obj|elevation|end_dialogue|endgame_movie|endgame_slideshow|explosion|fixed_param|float_msg|game_ticks|game_time|game_time_advance|game_time_hour|game_ui_disable|game_ui_enable|game_ui_is_disabled|gdialog_barter|gdialog_mod_barter|gdialog_set_barter_mod|get_critter_stat|get_day|get_month|get_pc_stat|get_poison|gfade_in|gfade_out|giQ_Option|give_exp_points|global_var|goto_xy|gSay_End|gSay_Message|gSay_Option|gSay_Reply|gSay_Start|has_skill|has_trait|how_much|inven_count|inven_ptr|inven_unwield|is_critical|is_loading_game|is_skill_tagged|is_success|item_caps_adjust|item_caps_total|jam_lock|kill_critter|kill_critter_type|language_filter_is_on|load_map|local_var|map_first_run|map_is_known|map_known|map_var|message_str|move_obj_inven_to_obj|move_to|obj_art_fid|obj_being_used_with|obj_can_hear_obj|obj_can_see_obj|obj_carrying_pid_obj|obj_close|obj_drop_everything|obj_is_carrying_obj_pid|obj_is_locked|obj_is_open|obj_is_visible_flag|obj_item_subtype|obj_lock|obj_name|obj_on_screen|obj_open|obj_pid|obj_set_light_level|obj_type|obj_unlock|override_map_start|party_add|party_member_count|party_member_obj|party_remove|pickup_obj|play_gmovie|play_sfx|poison|proto_data|radiation_dec|radiation_inc|random|reg_anim_animate|reg_anim_animate_forever|reg_anim_animate_reverse|reg_anim_begin|reg_anim_clear|reg_anim_end|reg_anim_obj_move_to_obj|reg_anim_obj_move_to_tile|reg_anim_obj_run_to_obj|reg_anim_obj_run_to_tile|reg_anim_play_sfx|rm_fixed_timer_event|rm_mult_objs_from_inven|rm_obj_from_inven|rm_timer_event|roll_dice|roll_vs_skill|rotation_to_tile|running_burning_guy|scr_return|script_action|script_overrides|self_obj|set_critter_stat|set_exit_grids|set_global_var|set_light_level|set_local_var|set_map_start|set_map_var|set_obj_visibility|signal_end_game|skill_contest|source_obj|start_dialogue|start_gdialog|start_gialog|target_obj|terminate_combat|tile_contains_obj_pid|tile_contains_pid_obj|tile_distance|tile_distance_objs|tile_is_visible|tile_num|tile_num_in_direction|town_known|town_map|use_obj|use_obj_on_obj|using_skill|violence_level_setting|wield_obj|wield_obj_critter|wm_area_set_pos|world_map|world_map_x_pos|world_map_y_pos)\b/,
      alias: 'function',
    },
    constant: {
      pattern:
        /\b(?:STAT_[A-Za-z_]+|SKILL_[A-Za-z_]+|PERK_[A-Za-z_]+|TRAIT_[A-Za-z_]+|PID_[A-Za-z_]+|SCRIPT_[A-Za-z_]+|OBJ_TYPE_[A-Za-z_]+|ITEM_TYPE_[A-Za-z_]+|DAMAGE_TYPE_[A-Za-z_]+|DMG_[A-Za-z_]+|KILL_TYPE_[A-Za-z_]+|GVAR_[A-Za-z_]+|LVAR_[A-Za-z_]+|MVAR_[A-Za-z_]+|FLOAT_MSG_[A-Za-z_]+|INVEN_TYPE_[A-Za-z_]+|ANIM_[A-Za-z_]+|DAM_[A-Za-z_]+|PCSTAT_[A-Za-z_]+|GOOD|NEUTRAL|BAD|TRUE|FALSE|true|false|NULL)\b/,
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

  // Clean up and eventually restore former globalThis.Prism object (if any)
  delete (globalThis as Optional<typeof globalThis, 'Prism'>).Prism;
  if (typeof PrismBefore !== 'undefined') {
    globalThis.Prism = PrismBefore;
  }
}
